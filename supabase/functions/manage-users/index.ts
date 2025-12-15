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

    const { action, ...data } = await req.json();

    // Allow init_all_users without authentication (bootstrap action)
    if (action === "init_superadmins" || action === "init_all_users") {
      console.log("Starting user initialization...");
      
      // 25 Health Centers
      const CENTERS = [
        { id: 'obhur', nameAr: 'أبحر الشمالية' },
        { id: 'salhiyah', nameAr: 'الصالحية' },
        { id: 'majed', nameAr: 'الماجد' },
        { id: 'shatea', nameAr: 'الشاطئ' },
        { id: 'sheraa', nameAr: 'الشراع' },
        { id: 'wafa', nameAr: 'الوفاء' },
        { id: 'rayyan', nameAr: 'الريان' },
        { id: 'khalid', nameAr: 'خالد النموذجي' },
        { id: 'briman', nameAr: 'بريمان' },
        { id: 'firdous', nameAr: 'الفردوس' },
        { id: 'thuwal', nameAr: 'ثول' },
        { id: 'dhahban', nameAr: 'ذهبان' },
        { id: 'sawari', nameAr: 'الصواري' },
        { id: 'rehab', nameAr: 'الرحاب' },
        { id: 'bawadi1', nameAr: 'البوادي 1' },
        { id: 'bawadi2', nameAr: 'البوادي 2' },
        { id: 'safa2', nameAr: 'الصفا 2' },
        { id: 'safa1', nameAr: 'الصفا 1' },
        { id: 'salamah', nameAr: 'السلامة' },
        { id: 'marwah', nameAr: 'المروة' },
        { id: 'naeem', nameAr: 'النعيم' },
        { id: 'nahda', nameAr: 'النهضة' },
        { id: 'faisaliyah', nameAr: 'الفيصلية' },
        { id: 'mushrifah', nameAr: 'مشرفة' },
        { id: 'rabwah', nameAr: 'الربوة' }
      ];

      // 3 Super Admins
      const superadmins = [
        { username: "mahdi", password: "116140", name_ar: "مهدي", role: "superadmin", center_id: null },
        { username: "rayan", password: "116140", name_ar: "ريان", role: "superadmin", center_id: null },
        { username: "firas", password: "116140", name_ar: "فراس", role: "superadmin", center_id: null },
      ];

      // 25 Center Users
      const centerUsers = CENTERS.map(c => ({
        username: c.id,
        password: "123456",
        name_ar: c.nameAr,
        role: "center",
        center_id: c.id
      }));

      const allUsers = [...superadmins, ...centerUsers];
      const results = [];

      for (const user of allUsers) {
        const email = `${user.username}@tbc.local`;
        console.log(`Processing ${user.username}...`);

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (existingUser) {
          console.log(`${user.username} already exists`);
          results.push({ username: user.username, status: "already_exists" });
          continue;
        }

        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: user.password,
          email_confirm: true,
        });

        if (createError) {
          console.error(`Error creating ${user.username}:`, createError);
          results.push({ username: user.username, status: "error", error: createError.message });
          continue;
        }

        console.log(`Created auth user for ${user.username}: ${newUser.user.id}`);

        // Create profile
        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
          user_id: newUser.user.id,
          username: user.username,
          name_ar: user.name_ar,
          center_id: user.center_id,
        });

        if (profileError) {
          console.error(`Error creating profile for ${user.username}:`, profileError);
        }

        // Create role
        const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
          user_id: newUser.user.id,
          role: user.role,
        });

        if (roleError) {
          console.error(`Error creating role for ${user.username}:`, roleError);
        }

        results.push({ username: user.username, status: "created", role: user.role });
      }

      console.log("User initialization completed:", results);

      return new Response(
        JSON.stringify({ success: true, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For all other actions, require authentication
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
        // Query profiles and roles separately to avoid relationship issues
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) {
          return new Response(
            JSON.stringify({ error: profilesError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: roles, error: rolesError } = await supabaseAdmin
          .from("user_roles")
          .select("*");

        if (rolesError) {
          return new Response(
            JSON.stringify({ error: rolesError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Join data in code
        const usersWithRoles = profiles?.map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.user_id);
          return {
            ...profile,
            role: userRole?.role || "center",
          };
        }) || [];

        return new Response(
          JSON.stringify({ users: usersWithRoles }),
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
