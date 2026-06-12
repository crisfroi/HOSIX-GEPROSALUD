import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface GenerarQRRequest {
  tipo_documento: string;
  documento_id: string;
  tipo_solicitud: "laboratorio" | "imagenologia";
}

// Función para generar código QR (usando API externa)
async function generarCodigoQR(data: string): Promise<string> {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
}

console.info("Edge Function: hosix-generar-qr-solicitud iniciado");

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req, ctx) => {
      try {
        const payload: GenerarQRRequest = await req.json();
        const { tipo_documento, documento_id, tipo_solicitud } = payload;

        if (!tipo_documento || !documento_id) {
          return Response.json(
            { error: "tipo_documento y documento_id requeridos" },
            { status: 400 }
          );
        }

        // Usar cliente Supabase del contexto
        const { supabase } = ctx;

        // 1. Obtener datos de la solicitud
        let solicitudData: any = null;
        let tableName = "";
        let numeroDocumento = "";

        if (tipo_solicitud === "laboratorio") {
          tableName = "hosix_laboratorio_solicitudes";
          const { data } = await supabase
            .from(tableName)
            .select(
              `
              id,
              paciente_id,
              diagnostico_clinico,
              prioridad,
              estado,
              fecha_solicitud,
              solicitudes_items:hosix_laboratorio_solicitudes_items(
                id,
                prueba_id,
                prueba:hosix_laboratorio_pruebas_catalogo(codigo, nombre)
              )
            `
            )
            .eq("id", documento_id)
            .single();

          solicitudData = data;
          numeroDocumento = `LAB${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
        } else if (tipo_solicitud === "imagenologia") {
          tableName = "hosix_imagenologia_solicitudes";
          const { data } = await supabase
            .from(tableName)
            .select(
              `
              id,
              paciente_id,
              diagnostico_clinico,
              prioridad,
              estado,
              fecha_solicitud,
              modalidad:hosix_imagenologia_modalidades(codigo, nombre)
            `
            )
            .eq("id", documento_id)
            .single();

          solicitudData = data;
          numeroDocumento = `IMG${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
        }

        if (!solicitudData) {
          return Response.json(
            { error: "Solicitud no encontrada" },
            { status: 404 }
          );
        }

        // 2. Generar código QR
        const qrData = {
          tipo: tipo_solicitud,
          numero: numeroDocumento,
          documento_id,
          paciente_id: solicitudData.paciente_id,
          fecha: new Date().toISOString(),
          prioridad: solicitudData.prioridad,
        };

        const qrString = JSON.stringify(qrData);
        const qrImageUrl = await generarCodigoQR(qrString);

        // 3. Generar código QR basado en hash
        const codigoQR = `QR${documento_id.slice(0, 8).toUpperCase()}${numeroDocumento.slice(-4)}`;

        // 4. Guardar en hosix_codigos_documentos
        const { data: codigoGuardado, error: errorGuardar } =
          await supabase
            .from("hosix_codigos_documentos")
            .insert([
              {
                tipo_documento,
                documento_id,
                numero_documento: numeroDocumento,
                codigo_qr: codigoQR,
                datos_json: qrData,
              },
            ])
            .select();

        if (errorGuardar) throw errorGuardar;

        // 5. Actualizar la solicitud con el código QR
        const updatePayload: any = {
          codigo_qr: codigoQR,
          numero_documento: numeroDocumento,
        };

        const { error: errorUpdate } = await supabase
          .from(tableName)
          .update(updatePayload)
          .eq("id", documento_id);

        if (errorUpdate) throw errorUpdate;

        return Response.json({
          success: true,
          numero_documento: numeroDocumento,
          codigo_qr: codigoQR,
          qr_image_url: qrImageUrl,
          datos: qrData,
          mensaje: "Código QR generado exitosamente",
        });
      } catch (error: any) {
        return Response.json(
          { error: error.message || "Error generando QR" },
          { status: 500 }
        );
      }
    }
  ),
};
