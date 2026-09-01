// invite-client -- called by the admin dashboard's "Invite to Portal" action.
// Verifies the caller is a real admin, links the client to a `users` row
// (creating one if it doesn't exist yet), and sends a Supabase Auth invite
// email so the client can log into the portal (portal.html) via magic link.
// Runs with the service_role key because auth.admin.inviteUserByEmail is a
// privileged Admin API call -- never exposed to the browser directly.
//
// Requires these Edge Function secrets (auto-provided by Supabase):
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Where the invite email's link lands after Supabase authenticates the
// client -- the portal picks up the session from the URL automatically,
// same mechanism admin.html already uses for its magic-link sign-in.
const PORTAL_REDIRECT_URL = "https://thelocaleyes.net/portal.html";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Missing session" }, 401);
  }
  const jwt = authHeader.slice("Bearer ".length);

  let body: { client_id?: string; email?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const clientId = body.client_id;
  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim() || null;
  if (!clientId || !email) {
    return json({ error: "client_id and email are required" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user?.email) {
    return json({ error: "Invalid session" }, 401);
  }
  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", userData.user.email)
    .maybeSingle();
  if (!adminRow) {
    return json({ error: "Not an approved admin" }, 403);
  }

  const { data: clientRow } = await supabase.from("clients").select("id, user_id").eq("id", clientId).maybeSingle();
  if (!clientRow) {
    return json({ error: "Unknown client_id" }, 404);
  }

  // Find or create the `users` row this client logs in as.
  let targetUserId = clientRow.user_id as string | null;
  const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (existingUser) {
    targetUserId = existingUser.id;
  } else {
    const { data: newUser, error: newUserErr } = await supabase
      .from("users")
      .insert([{ email, name, role: "client" }])
      .select("id")
      .single();
    if (newUserErr) {
      return json({ error: "Could not create user: " + newUserErr.message }, 500);
    }
    targetUserId = newUser.id;
  }

  if (clientRow.user_id !== targetUserId) {
    const { error: linkErr } = await supabase.from("clients").update({ user_id: targetUserId }).eq("id", clientId);
    if (linkErr) {
      return json({ error: "Could not link client: " + linkErr.message }, 500);
    }
  }

  const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: PORTAL_REDIRECT_URL,
  });
  if (inviteErr && !inviteErr.message?.includes("already been registered")) {
    return json({ error: "Could not send invite: " + inviteErr.message }, 500);
  }

  return json({ ok: true, already_registered: !!inviteErr });
});
