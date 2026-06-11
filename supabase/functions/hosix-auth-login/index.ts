import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Find user by username or email
    const { data: usuario, error: usuarioError } = await supabase
      .from("hosix_usuarios")
      .select(
        `
        id,
        username,
        email,
        nombre_completo,
        perfil_id,
        centro_salud_id,
        perfil:hosix_perfiles(nombre, codigo)
      `
      )
      .or(`username.eq.${username},email.eq.${username}`)
      .single();

    if (usuarioError || !usuario) {
      console.error("User not found:", usuarioError);
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For development: accept any password for admin user
    // In production, implement proper password verification
    if (username.toLowerCase() === "admin" && password === "SuperAdmin#2026") {
      const perfil = Array.isArray(usuario.perfil)
        ? usuario.perfil[0]
        : usuario.perfil;

      return new Response(
        JSON.stringify({
          user: {
            id: usuario.id,
            email: usuario.email,
            username: usuario.username,
            nombre: usuario.nombre_completo?.split(" ")[0] || "Admin",
            apellido: usuario.nombre_completo?.split(" ")[1] || "Sistema",
            rol: "SUPER_ADMINISTRADOR",
            centro_salud_id: usuario.centro_salud_id,
            centro_salud_nombre: "Centro de Salud Principal",
            perfil: perfil?.nombre || "Administrador",
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid username or password" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
