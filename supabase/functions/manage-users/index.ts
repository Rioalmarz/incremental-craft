import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the request is from an authenticated superadmin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the requesting user is a superadmin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (!roleData || roleData.role !== "superadmin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Superadmin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...data } = await req.json();

    switch (action) {
      case "create_user": {
        const { username, password, name_ar, role, center_id } = data;

        if (!username || !password || !role) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create email from username
        const email = `${username.toLowerCase()}@tbc.local`;

        // Create user in auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            user_id: newUser.user.id,
            username: username.toLowerCase(),
            name_ar: name_ar || username,
            center_id: role === "center" ? center_id : null,
          });

        if (profileError) {
          // Rollback: delete the created user
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: profileError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create user role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: newUser.user.id,
            role: role,
          });

        if (roleError) {
          // Rollback
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          return new Response(
            JSON.stringify({ error: roleError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, user_id: newUser.user.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_password": {
        const { user_id, new_password } = data;

        if (!user_id || !new_password) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password: new_password,
        });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_user": {
        const { user_id } = data;

        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "Missing user_id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_all_users": {
        const { data: profiles, error } = await supabaseAdmin
          .from("profiles")
          .select(`
            *,
            user_roles (role)
          `)
          .order("created_at", { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ users: profiles }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "init_superadmins": {
        // Create the 3 default superadmin accounts
        const superadmins = [
          { username: "mahdi", password: "116140", name_ar: "Mahdi" },
          { username: "rayan", password: "116140", name_ar: "Rayan" },
          { username: "firas", password: "116140", name_ar: "Firas" },
        ];

        const results = [];

        for (const admin of superadmins) {
          const email = `${admin.username}@tbc.local`;

          // Check if user already exists
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === email);

          if (existingUser) {
            results.push({ username: admin.username, status: "already_exists" });
            continue;
          }

          // Create user
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: admin.password,
            email_confirm: true,
          });

          if (createError) {
            results.push({ username: admin.username, status: "error", error: createError.message });
            continue;
          }

          // Create profile
          await supabaseAdmin.from("profiles").insert({
            user_id: newUser.user.id,
            username: admin.username,
            name_ar: admin.name_ar,
            center_id: null,
          });

          // Create role
          await supabaseAdmin.from("user_roles").insert({
            user_id: newUser.user.id,
            role: "superadmin",
          });

          results.push({ username: admin.username, status: "created" });
        }

        return new Response(
          JSON.stringify({ success: true, results }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
