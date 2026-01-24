import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { timingSafeEqual } from "https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://hirocross-athlete.lovable.app',
  'https://id-preview--5f17aae3-63c5-400c-88ed-0a217b5a0c09.lovable.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  // Pad to same length to prevent length-based timing attacks
  const maxLen = Math.max(a.length, b.length, 64);
  const aBuffer = encoder.encode(a.padEnd(maxLen, '\0'));
  const bBuffer = encoder.encode(b.padEnd(maxLen, '\0'));
  return timingSafeEqual(aBuffer, bBuffer);
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminAccessCode = Deno.env.get('ADMIN_ACCESS_CODE');

    if (!adminAccessCode) {
      console.error('ADMIN_ACCESS_CODE not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code, requestedRole } = await req.json();

    // Validate input
    if (!code || !requestedRole) {
      return new Response(
        JSON.stringify({ error: 'Missing code or requestedRole' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['owner', 'coach', 'athlete'].includes(requestedRole)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin access code using constant-time comparison
    const codeValid = secureCompare(code, adminAccessCode);
    
    if (!codeValid) {
      console.log(`Invalid access code attempt for user ${user.id}`);
      return new Response(
        JSON.stringify({ verified: false, message: 'Invalid access code' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has this role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', requestedRole)
      .single();

    if (existingRole) {
      return new Response(
        JSON.stringify({ verified: true, message: 'Role already assigned', roleAssigned: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role to user
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: requestedRole });

    if (insertError) {
      console.error('Error inserting role:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully assigned role ${requestedRole} to user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        verified: true, 
        message: 'Access code verified and role assigned',
        roleAssigned: true,
        role: requestedRole 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(null), 'Content-Type': 'application/json' } }
    );
  }
});
