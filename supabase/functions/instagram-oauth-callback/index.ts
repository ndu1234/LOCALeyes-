// instagram-oauth-callback -- Meta redirects the client's browser here
// directly after they click "Allow" (or "Deny") on the consent screen.
// Runs unauthenticated (no Supabase session -- the browser is mid-redirect
// from Meta, not logged into LOCALeyes at this URL), so trust comes from
// the one-time `state` token minted by instagram-connect-url, not from any
// session. Exchanges the code for a long-lived Page access token, finds the
// connected Instagram Business account, and stores the connection.
//
// Requires these Edge Function secrets (set via `supabase secrets set`,
// never committed): META_APP_ID, META_APP_SECRET, SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "npm:@supabase/supabase-js@2";

const META_APP_ID = Deno.env.get("META_APP_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/instagram-oauth-callback`;
// Where the browser lands after this function finishes, success or not --
// the admin dashboard reads ?instagram_connected=1|0 to show a status toast.
const ADMIN_RETURN_URL = "https://thelocaleyes.net/admin.html";

function redirect(params: Record<string, string>): Response {
  const url = new URL(ADMIN_RETURN_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const metaError = url.searchParams.get("error");

  if (metaError) {
    // The client clicked "Deny" (or something else went wrong on Meta's
    // side) -- an honest, expected outcome, not a bug.
    return redirect({ instagram_connected: "0", reason: "declined" });
  }
  if (!code || !state) {
    return redirect({ instagram_connected: "0", reason: "missing_params" });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Consume the state -- one-time use, and this is the only source of truth
  // for which client this connection belongs to.
  const { data: stateRow, error: stateErr } = await supabase
    .from("oauth_states")
    .select("client_id, connected_by_email, expires_at")
    .eq("state", state)
    .maybeSingle();
  if (stateErr || !stateRow) {
    return redirect({ instagram_connected: "0", reason: "invalid_state" });
  }
  await supabase.from("oauth_states").delete().eq("state", state);

  if (new Date(stateRow.expires_at).getTime() < Date.now()) {
    return redirect({ instagram_connected: "0", reason: "expired" });
  }

  try {
    // Step 1: exchange the auth code for a short-lived user access token.
    const tokenUrl = new URL("https://graph.facebook.com/v26.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", META_APP_ID);
    tokenUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    tokenUrl.searchParams.set("client_secret", META_APP_SECRET);
    tokenUrl.searchParams.set("code", code);
    const shortLivedResp = await fetch(tokenUrl.toString());
    const shortLivedJson = await shortLivedResp.json();
    if (!shortLivedResp.ok) throw new Error(shortLivedJson?.error?.message ?? "short-lived token exchange failed");

    // Step 2: exchange for a long-lived user access token (~60 days,
    // renewable) -- a short-lived one expires within ~1-2 hours, useless
    // for ongoing client reporting.
    const longLivedUrl = new URL("https://graph.facebook.com/v26.0/oauth/access_token");
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", META_APP_ID);
    longLivedUrl.searchParams.set("client_secret", META_APP_SECRET);
    longLivedUrl.searchParams.set("fb_exchange_token", shortLivedJson.access_token);
    const longLivedResp = await fetch(longLivedUrl.toString());
    const longLivedJson = await longLivedResp.json();
    if (!longLivedResp.ok) throw new Error(longLivedJson?.error?.message ?? "long-lived token exchange failed");
    const userToken = longLivedJson.access_token as string;
    const expiresInS = longLivedJson.expires_in as number | undefined;

    // Step 3: find a Page this user manages that has a connected Instagram
    // Business account. A Page's own access_token (not the user token) is
    // what's actually used for Instagram Graph API calls against that
    // Page's connected account, and it inherits the long-lived user
    // token's ~60-day lifetime.
    const pagesResp = await fetch(
      `https://graph.facebook.com/v26.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`,
    );
    const pagesJson = await pagesResp.json();
    if (!pagesResp.ok) throw new Error(pagesJson?.error?.message ?? "could not list Pages");

    type PageRow = { id: string; access_token: string; instagram_business_account?: { id: string } };
    const pageWithIg = (pagesJson.data as PageRow[] | undefined)?.find((p) => p.instagram_business_account);
    if (!pageWithIg) {
      return redirect({ instagram_connected: "0", reason: "no_instagram_business_account" });
    }
    const igAccountId = pageWithIg.instagram_business_account!.id;
    const pageToken = pageWithIg.access_token;

    // Step 4: fetch the connected account's @handle for display purposes.
    const igResp = await fetch(`https://graph.facebook.com/v26.0/${igAccountId}?fields=username&access_token=${pageToken}`);
    const igJson = await igResp.json();
    const username = igResp.ok ? (igJson.username as string | undefined) : undefined;

    const tokenExpiresAt = expiresInS ? new Date(Date.now() + expiresInS * 1000).toISOString() : null;

    // Step 5: store it. Two writes -- metadata (safe for the admin
    // dashboard to read) and the token (never readable by anon/authenticated,
    // see the migration's docstring).
    const { error: acctErr } = await supabase.from("client_social_accounts").upsert(
      {
        client_id: stateRow.client_id,
        platform: "instagram",
        username: username ?? null,
        instagram_business_account_id: igAccountId,
        page_id: pageWithIg.id,
        connected_by_email: stateRow.connected_by_email,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "client_id,platform" },
    );
    if (acctErr) throw new Error(acctErr.message);

    const { error: tokenErr } = await supabase.from("client_social_tokens").upsert(
      {
        client_id: stateRow.client_id,
        platform: "instagram",
        access_token: pageToken,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id,platform" },
    );
    if (tokenErr) throw new Error(tokenErr.message);

    return redirect({ instagram_connected: "1", username: username ?? "" });
  } catch (err) {
    console.error("instagram-oauth-callback failed:", err);
    return redirect({ instagram_connected: "0", reason: "exchange_failed" });
  }
});
