import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface SolicitudSync {
  solicitud_id: string;
  estado_nuevo: "pendiente" | "recibida" | "procesando" | "completada" | "cancelada";
  numero_muestra?: string;
  fecha_recoleccion?: string;
}

interface ResultadoSync {
  solicitud_id: string;
  solicitud_item_id: string;
  valor_resultado: number;
  unidad_resultado: string;
  rango_referencia_minimo?: number;
  rango_referencia_maximo?: number;
  observaciones?: string;
}

console.info("Edge Function: hosix-lab-sync iniciado");

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req, ctx) => {
      try {
        const { action, payload } = await req.json();
        const { supabase } = ctx;

        switch (action) {
          case "actualizar_estado_solicitud": {
            const { solicitud_id, estado_nuevo, numero_muestra, fecha_recoleccion }: SolicitudSync = payload;

            const { error } = await supabase
              .from("hosix_laboratorio_solicitudes")
              .update({
                estado: estado_nuevo,
                numero_muestra,
                fecha_recoleccion: fecha_recoleccion
                  ? new Date(fecha_recoleccion).toISOString()
                  : null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", solicitud_id);

            if (error) throw error;

            return Response.json({
              success: true,
              message: "Solicitud actualizada",
            });
          }

          case "registrar_resultado": {
            const resultado: ResultadoSync = payload;

            const { error } = await supabase
              .from("hosix_laboratorio_resultados")
              .insert([
                {
                  solicitud_id: resultado.solicitud_id,
                  solicitud_item_id: resultado.solicitud_item_id,
                  valor_resultado: resultado.valor_resultado,
                  unidad_resultado: resultado.unidad_resultado,
                  rango_referencia_minimo: resultado.rango_referencia_minimo,
                  rango_referencia_maximo: resultado.rango_referencia_maximo,
                  observaciones: resultado.observaciones,
                  fecha_resultado: new Date().toISOString(),
                },
              ]);

            if (error) throw error;

            // Actualizar estado de solicitud a completada si todos los items tienen resultado
            const { data: items } = await supabase
              .from("hosix_laboratorio_solicitudes_items")
              .select("id")
              .eq("solicitud_id", resultado.solicitud_id);

            const { data: resultados } = await supabase
              .from("hosix_laboratorio_resultados")
              .select("solicitud_item_id")
              .eq("solicitud_id", resultado.solicitud_id);

            if (items && resultados && items.length === resultados.length) {
              await supabase
                .from("hosix_laboratorio_solicitudes")
                .update({ estado: "completada" })
                .eq("id", resultado.solicitud_id);
            }

            return Response.json({
              success: true,
              message: "Resultado registrado",
            });
          }

          case "listar_solicitudes_pendientes": {
            const { data, error } = await supabase
              .from("hosix_laboratorio_solicitudes")
              .select(
                `
                id,
                numero_muestra,
                diagnostico_clinico,
                estado,
                prioridad,
                fecha_solicitud,
                solicitudes_items:hosix_laboratorio_solicitudes_items(
                  id,
                  prueba_id,
                  prueba:hosix_laboratorio_pruebas_catalogo(nombre, codigo)
                )
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
