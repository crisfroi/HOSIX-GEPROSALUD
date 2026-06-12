import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface EstudioSync {
  solicitud_id: string;
  numero_serie: string;
  descripcion: string;
  numero_imagenes: number;
  formato_archivo: string;
  ubicacion_dicom?: string;
}

interface ReporteSync {
  estudio_id: string;
  solicitud_id: string;
  hallazgos: string;
  impresion_diagnostica: string;
  recomendaciones?: string;
  radiologist_id: string;
}

interface ProgramarSolicitudSync {
  solicitud_id: string;
  fecha_programada: string;
  sala_id?: string;
  observaciones?: string;
}

console.info("Edge Function: hosix-imagen-sync iniciado");

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req, ctx) => {
      try {
        const { action, payload } = await req.json();
        const { supabase } = ctx;

        switch (action) {
          case "programar_estudio": {
            const { solicitud_id, fecha_programada, sala_id, observaciones }: ProgramarSolicitudSync = payload;

            const { error } = await supabase
              .from("hosix_imagenologia_solicitudes")
              .update({
                estado: "programada",
                fecha_programada,
                observaciones,
                updated_at: new Date().toISOString(),
              })
              .eq("id", solicitud_id);

            if (error) throw error;

            return Response.json({
              success: true,
              message: "Estudio programado",
            });
          }

          case "registrar_estudio": {
            const estudio: EstudioSync = payload;

            const { data, error } = await supabase
              .from("hosix_imagenologia_estudios")
              .insert([
                {
                  solicitud_id: estudio.solicitud_id,
                  numero_serie: estudio.numero_serie,
                  descripcion: estudio.descripcion,
                  numero_imagenes: estudio.numero_imagenes,
                  formato_archivo: estudio.formato_archivo,
                  ubicacion_dicom: estudio.ubicacion_dicom,
                  fecha_estudio: new Date().toISOString(),
                },
              ])
              .select();

            if (error) throw error;

            // Actualizar estado solicitud a realizada
            await supabase
              .from("hosix_imagenologia_solicitudes")
              .update({ estado: "realizada", updated_at: new Date().toISOString() })
              .eq("id", estudio.solicitud_id);

            return Response.json({
              success: true,
              message: "Estudio registrado",
              estudio: data?.[0],
            });
          }

          case "registrar_reporte": {
            const reporte: ReporteSync = payload;

            const { data, error } = await supabase
              .from("hosix_imagenologia_reportes")
              .insert([
                {
                  estudio_id: reporte.estudio_id,
                  solicitud_id: reporte.solicitud_id,
                  hallazgos: reporte.hallazgos,
                  impresion_diagnostica: reporte.impresion_diagnostica,
                  recomendaciones: reporte.recomendaciones,
                  radiologist_id: reporte.radiologist_id,
                  fecha_reporte: new Date().toISOString(),
                },
              ])
              .select();

            if (error) throw error;

            return Response.json({
              success: true,
              message: "Reporte registrado",
              reporte: data?.[0],
            });
          }

          case "firmar_reporte": {
            const { reporte_id, radiologist_id } = payload;

            const { error } = await supabase
              .from("hosix_imagenologia_reportes")
              .update({
                radiologist_id,
                fecha_firma: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", reporte_id);

            if (error) throw error;

            return Response.json({
              success: true,
              message: "Reporte firmado",
            });
          }

          case "listar_solicitudes_pendientes": {
            const { data, error } = await supabase
              .from("hosix_imagenologia_solicitudes")
              .select(
                `
                id,
                diagnostico_clinico,
                zona_interes,
                prioridad,
                estado,
                fecha_solicitud,
                modalidad:hosix_imagenologia_modalidades(nombre, categoria)
              `
              )
              .eq("estado", "pendiente")
              .order("fecha_solicitud", { ascending: false });

            if (error) throw error;

            return Response.json({
              success: true,
              data,
            });
          }

          default:
            return Response.json(
              { error: "Acción no reconocida" },
              { status: 400 }
            );
        }
      } catch (error: any) {
        return Response.json(
          { error: error.message || "Error en sincronización" },
          { status: 500 }
        );
      }
    }
  ),
};
