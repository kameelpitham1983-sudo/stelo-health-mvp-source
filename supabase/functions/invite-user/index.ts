import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create a service-role client (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create a user-scoped client to verify the caller's identity
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is master_admin
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== "master_admin" || !callerProfile.is_active) {
      return new Response(JSON.stringify({ error: "Only the Master Administrator can invite users." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, role, displayName, companyId, linkedEmployeeId } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!role || !["admin", "coordinator", "provider", "employer", "employee", "lab"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if email is already registered
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      // Check if profile already exists
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id, role")
        .eq("id", existing.id)
        .maybeSingle();

      if (existingProfile) {
        return new Response(JSON.stringify({
          error: "An account with this email already exists. Use the User Management page to manage this user.",
        }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Auth user exists but no profile — create the profile
      const { error: profileErr } = await adminClient.from("profiles").insert({
        id: existing.id,
        role,
        display_name: displayName || email.split("@")[0],
        avatar_initials: (displayName || email.split("@")[0]).slice(0, 2).toUpperCase(),
        company_id: companyId || null,
        linked_employee_id: linkedEmployeeId || null,
        is_active: true,
      });

      if (profileErr) {
        return new Response(JSON.stringify({ error: "Failed to create profile: " + profileErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log to audit
      await adminClient.from("audit_log").insert({
        actor_id: userData.user.id,
        actor_name: callerProfile.display_name || userData.user.email,
        actor_role: "master_admin",
        record_type: "user",
        record_id: existing.id,
        record_reference: email,
        action: "invite_existing",
        details: `Existing auth user assigned role: ${role}`,
      });

      return new Response(JSON.stringify({ success: true, message: "Existing account linked with new role." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invite new user via Supabase Auth
    const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: Deno.env.get("APP_REDIRECT_URL") || undefined,
    });

    if (inviteErr) {
      return new Response(JSON.stringify({ error: "Failed to send invitation: " + inviteErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = inviteData.user.id;

    // The handle_new_user trigger will create a default 'employee' profile.
    // Update it to the requested role.
    const { error: profileErr } = await adminClient.from("profiles")
      .update({
        role,
        display_name: displayName || email.split("@")[0],
        avatar_initials: (displayName || email.split("@")[0]).slice(0, 2).toUpperCase(),
        company_id: companyId || null,
        linked_employee_id: linkedEmployeeId || null,
      })
      .eq("id", newUserId);

    if (profileErr) {
      // Profile might not exist yet if trigger hasn't fired — insert directly
      await adminClient.from("profiles").insert({
        id: newUserId,
        role,
        display_name: displayName || email.split("@")[0],
        avatar_initials: (displayName || email.split("@")[0]).slice(0, 2).toUpperCase(),
        company_id: companyId || null,
        linked_employee_id: linkedEmployeeId || null,
        is_active: true,
      });
    }

    // Log to audit
    await adminClient.from("audit_log").insert({
      actor_id: userData.user.id,
      actor_name: callerProfile.display_name || userData.user.email,
      actor_role: "master_admin",
      record_type: "user",
      record_id: newUserId,
      record_reference: email,
      action: "invite_user",
      details: `Invited new user with role: ${role}`,
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Invitation sent to ${email}. The user will receive an email to set their password.`,
      userId: newUserId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
