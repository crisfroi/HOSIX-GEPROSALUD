import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

console.info("Edge Function: hosix-caja-scan iniciado");

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req, ctx) => {
      try {
        const { codigo_qr, numero_documento } = await req.json();
        const { supabase } = ctx;

        if (!codigo_qr && !numero_documento) {
          return Response.json(
            { error: "codigo_qr o numero_documento requerido" },
            { status: 400 }
          );
        }

        // 1. Buscar documento por QR o número
        const searchQuery = codigo_qr
          ? supabase
              .from("hosix_codigos_documentos")
              .select("*")
              .eq("codigo_qr", codigo_qr)
          : supabase
              .from("hosix_codigos_documentos")
              .select("*")
              .eq("numero_documento", numero_documento);

        const { data: codigoData, error: errorBusqueda } = await searchQuery.single();

        if (errorBusqueda || !codigoData) {
          return Response.json(
            { error: "Documento no encontrado", codigo: errorBusqueda?.code },
            { status: 404 }
          );
        }

        // 2. Actualizar contador de escaneos
        await supabase
          .from("hosix_codigos_documentos")
          .update({
            escaneo_count: (codigoData.escaneo_count || 0) + 1,
            primer_escaneo: codigoData.primer_escaneo || new Date().toISOString(),
            ultimo_escaneo: new Date().toISOString(),
          })
          .eq("id", codigoData.id);

        // 3. Obtener datos de la solicitud según tipo
        const tipoDocumento = codigoData.tipo_documento;
        const documentoId = codigoData.documento_id;
        let solicitudData: any = null;
        let servicios: any[] = [];

        if (tipoDocumento === "solicitud_lab") {
          const { data } = await supabase
            .from("hosix_laboratorio_solicitudes")
            .select(
              `
              id,
              paciente_id,
              diagnostico_clinico,
              prioridad,
              estado,
              estado_pago,
              monto_total,
              fecha_solicitud,
              solicitudes_items:hosix_laboratorio_solicitudes_items(
                id,
                prueba_id,
                prueba:hosix_laboratorio_pruebas_catalogo(id, codigo, nombre, valor_referencia_minimo, valor_referencia_maximo, unidad_medida)
              )
            `
            )
            .eq("id", documentoId)
            .single();

          solicitudData = data;
          if (data?.solicitudes_items) {
            servicios = data.solicitudes_items.map((item: any) => ({
              tipo: "laboratorio",
              item_id: item.prueba_id,
              codigo: item.prueba?.codigo,
              nombre: item.prueba?.nombre,
              precio: 0, // Obtener de tarifa si existe
              estado_pago: data.estado_pago,
            }));
          }
        } else if (tipoDocumento === "solicitud_imagen") {
          const { data } = await supabase
            .from("hosix_imagenologia_solicitudes")
            .select(
              `
              id,
              paciente_id,
              diagnostico_clinico,
              prioridad,
              estado,
              estado_pago,
              monto_total,
              fecha_solicitud,
              modalidad:hosix_imagenologia_modalidades(id, codigo, nombre)
            `
            )
            .eq("id", documentoId)
            .single();

          solicitudData = data;
          if (data?.modalidad) {
            servicios = [
              {
                tipo: "imagenologia",
                item_id: data.modalidad.id,
                codigo: data.modalidad.codigo,
                nombre: data.modalidad.nombre,
                precio: 0,
                estado_pago: data.estado_pago,
              },
            ];
          }
        }

        // 4. Obtener datos del paciente
        const { data: paciente } = await supabase
          .from("hosix_pacientes")
          .select("id, numero_cedula, nombre_completo")
          .eq("id", solicitudData?.paciente_id)
          .single();

        return Response.json({
          success: true,
          documento: {
            tipo: tipoDocumento,
            numero: codigoData.numero_documento,
            codigo_qr: codigoData.codigo_qr,
            generado_en: codigoData.generado_en,
            escaneos_totales: (codigoData.escaneo_count || 0) + 1,
          },
          solicitud: solicitudData,
          paciente,
          servicios,
          resumen: {
            total_servicios: servicios.length,
            estado_pago: solicitudData?.estado_pago,
            monto_total: solicitudData?.monto_total || 0,
            requiere_pago: solicitudData?.estado_pago === "pendiente",
          },
        });
      } catch (error: any) {
        return Response.json(
          { error: error.message || "Error procesando escaneo" },
          { status: 500 }
        );
      }
    }
  ),
};
