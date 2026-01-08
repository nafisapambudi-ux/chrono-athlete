import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify they're authenticated
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if requesting user is a coach or owner
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: "Failed to verify roles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isCoachOrOwner = roles?.some(r => r.role === "coach" || r.role === "owner");
    if (!isCoachOrOwner) {
      return new Response(
        JSON.stringify({ error: "Only coaches can link athletes" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, athleteId } = await req.json();

    // Validate input
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!athleteId || typeof athleteId !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid athlete ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the athlete belongs to this coach
    const { data: athlete, error: athleteError } = await supabaseAdmin
      .from("athletes")
      .select("id, user_id, name")
      .eq("id", athleteId)
      .eq("user_id", requestingUser.id)
      .maybeSingle();

    if (athleteError || !athlete) {
      return new Response(
        JSON.stringify({ error: "Athlete not found or you don't have permission" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up the user by email using admin client
    const { data: { users }, error: lookupError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (lookupError) {
      return new Response(
        JSON.stringify({ error: "Failed to look up user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "No user found with this email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the target user has athlete role, if not add it
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUser.id);

    const isAthlete = targetRoles?.some(r => r.role === "athlete");
    if (!isAthlete) {
      // Auto-add athlete role for the target user
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: targetUser.id, role: "athlete" });
      
      if (roleError) {
        console.error("Failed to add athlete role:", roleError);
        return new Response(
          JSON.stringify({ error: "Failed to assign athlete role to user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Added athlete role to user ${targetUser.id}`);
    }

    // Check if this user is already linked to another athlete
    const { data: existingLink } = await supabaseAdmin
      .from("athletes")
      .select("id, name")
      .eq("linked_user_id", targetUser.id)
      .neq("id", athleteId)
      .maybeSingle();

    if (existingLink) {
      return new Response(
        JSON.stringify({ 
          error: `This user is already linked to athlete "${existingLink.name}"` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link the athlete to the user
    const { error: updateError } = await supabaseAdmin
      .from("athletes")
      .update({ linked_user_id: targetUser.id })
      .eq("id", athleteId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to link athlete" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully linked ${athlete.name} to ${email}`,
        linkedUserId: targetUser.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
