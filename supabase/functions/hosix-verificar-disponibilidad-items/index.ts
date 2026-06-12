import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface DisponibilidadRequest {
  tipo_solicitud: "laboratorio" | "imagenologia";
  items: Array<{
    item_id: string;
    nombre: string;
  }>;
  centro_salud_id?: string;
}

console.info("Edge Function: hosix-verificar-disponibilidad-items iniciado");

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req, ctx) => {
      try {
        const payload: DisponibilidadRequest = await req.json();
        const { tipo_solicitud, items, centro_salud_id } = payload;
        const { supabase } = ctx;

        if (!tipo_solicitud || !items || items.length === 0) {
          return Response.json(
            { error: "tipo_solicitud e items requeridos" },
            { status: 400 }
          );
        }

        // Verificar disponibilidad según tipo
        const resultados = await Promise.all(
          items.map(async (item) => {
            let disponible = true;
            let centro_alterno = null;
            let nota = "";

            if (tipo_solicitud === "laboratorio") {
              // Verificar si la prueba está disponible en el catálogo
              const { data: prueba } = await supabase
                .from("hosix_laboratorio_pruebas_catalogo")
                .select("id, nombre, activa, laboratorio_interno")
                .eq("id", item.item_id)
                .single();

              if (!prueba) {
                disponible = false;
                nota = "Prueba no existe en catálogo";
              } else if (!prueba.activa) {
                disponible = false;
                nota = "Prueba desactivada";
                // Buscar centro alterno que ofrezca esta prueba
                const { data: alterno } = await supabase
                  .from("hosix_centros_salud")
                  .select("nombre")
                  .eq("ofrece_laboratorio", true)
                  .limit(1);
                if (alterno?.length > 0) {
                  centro_alterno = alterno[0].nombre;
                }
              } else if (!prueba.laboratorio_interno) {
                disponible = true;
                nota = "Prueba referenciada (externo)";
                centro_alterno = "Laboratorio externo";
              }
            } else if (tipo_solicitud === "imagenologia") {
              // Verificar si la modalidad está disponible
              const { data: modalidad } = await supabase
                .from("hosix_imagenologia_modalidades")
                .select("id, nombre, activa")
                .eq("id", item.item_id)
                .single();

              if (!modalidad) {
                disponible = false;
                nota = "Modalidad no existe";
              } else if (!modalidad.activa) {
                disponible = false;
                nota = "Modalidad no disponible (en mantenimiento)";
                // Buscar centro alterno
                const { data: alterno } = await supabase
                  .from("hosix_centros_salud")
                  .select("nombre")
                  .eq("tiene_imagenologia", true)
                  .neq("id", centro_salud_id || "")
                  .limit(1);
                if (alterno?.length > 0) {
                  centro_alterno = alterno[0].nombre;
                }
              }
            }

            return {
              item_id: item.item_id,
              nombre: item.nombre,
              disponible,
              centro_alterno,
              nota,
              icono: disponible ? "✅" : "❌",
              color: disponible ? "green" : "red",
            };
          })
        );

        return Response.json({
          success: true,
          tipo_solicitud,
          items_verificados: resultados,
          resumen: {
            total: resultados.length,
            disponibles: resultados.filter((r) => r.disponible).length,
            no_disponibles: resultados.filter((r) => !r.disponible).length,
          },
        });
      } catch (error: any) {
        return Response.json(
          { error: error.message || "Error verificando disponibilidad" },
          { status: 500 }
        );
      }
    }
  ),
};
