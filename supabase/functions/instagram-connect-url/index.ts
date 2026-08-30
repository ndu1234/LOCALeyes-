// instagram-connect-url -- called by the admin dashboard when an admin clicks
// "Connect Instagram" for a client. Verifies the caller is a real admin (via
// their Supabase session JWT), mints a one-time random `state` value, records
// it in `oauth_states` (so the callback function can later recover which
// client this connection is for -- state is never just "the client_id",
// which anyone could forge), and returns Meta's OAuth dialog URL for the
// browser to redirect to.
//
// Requires these Edge Function secrets (set via `supabase secrets set`,
// never committed): META_APP_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// META_APP_ID is not actually secret (Meta app IDs are public-safe), it's
// just simplest to manage alongside the others.

import { createClient } from "npm:@supabase/supabase-js@2";

const META_APP_ID = Deno.env.get("META_APP_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// The Meta app's registered "Valid OAuth Redirect URI" -- this Edge
// Function's own callback sibling, a stable HTTPS URL regardless of
// whether the flow was started from localhost or the live site.
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/instagram-oauth-callback`;

// Scopes needed to read+manage a connected Instagram Business account's
// content/comments/insights on the client's behalf (see the migration's
// docstring and the earlier conversation for why these specific ones).
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_comments",
  "instagram_business_manage_messages",
  "instagram_business_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing session" }), { status: 401 });
  }
  const jwt = authHeader.slice("Bearer ".length);

  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");
  if (!clientId) {
    return new Response(JSON.stringify({ error: "client_id is required" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Verify the caller's session belongs to a real, currently-approved admin
  // -- never trust a client_id-only request, since anyone could hit this
  // endpoint directly without a valid Supabase session otherwise.
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user?.email) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }
  const adminEmail = userData.user.email;

  const { data: adminRow } = await supabase
    .from("admins")
    .select("email")
    .eq("email", adminEmail)
    .maybeSingle();
  if (!adminRow) {
    return new Response(JSON.stringify({ error: "Not an approved admin" }), { status: 403 });
  }

  // Confirm the client actually exists before minting a state for it.
  const { data: clientRow } = await supabase.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!clientRow) {
    return new Response(JSON.stringify({ error: "Unknown client_id" }), { status: 404 });
  }

  const state = crypto.randomUUID();
  const { error: insertErr } = await supabase.from("oauth_states").insert({
    state,
    client_id: clientId,
    platform: "instagram",
    connected_by_email: adminEmail,
  });
  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 });
  }

  const dialogUrl = new URL("https://www.facebook.com/v26.0/dialog/oauth");
  dialogUrl.searchParams.set("client_id", META_APP_ID);
  dialogUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  dialogUrl.searchParams.set("state", state);
  dialogUrl.searchParams.set("scope", SCOPES);
  dialogUrl.searchParams.set("response_type", "code");

  return new Response(JSON.stringify({ url: dialogUrl.toString() }), {
    headers: { "Content-Type": "application/json" },
  });
});
