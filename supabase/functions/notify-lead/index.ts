/* Emails the founder when a new lead lands. Invoked by the notify_new_lead
   trigger on public.leads (see the 20260902200000 migration), which POSTs
   { record: <new leads row> } here via pg_net.

   Deployed with --no-verify-jwt (pg_net can't mint a user JWT, and the
   project uses new-style publishable keys, which aren't JWTs either), so the
   function does its own auth: the x-lead-secret header must match the
   LEAD_WEBHOOK_SECRET function secret. The trigger reads the same value from
   Vault (secret name "lead_webhook_secret").

   Function secrets used:
     LEAD_WEBHOOK_SECRET  shared secret, must match the Vault value
     RESEND_API_KEY       Resend API key (https://resend.com)
     NOTIFY_TO            where lead alerts go
     NOTIFY_FROM          optional; defaults to Resend's sandbox sender,
                          which only delivers to the Resend account owner's
                          own email until a domain is verified. */

function esc(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const secret = Deno.env.get('LEAD_WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-lead-secret') !== secret) {
    return new Response('unauthorized', { status: 401 });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('NOTIFY_TO');
  if (!apiKey || !to) {
    console.error('RESEND_API_KEY / NOTIFY_TO not configured — lead email skipped');
    return new Response('not configured', { status: 500 });
  }

  let record: Record<string, unknown>;
  try {
    ({ record } = await req.json());
    if (!record || typeof record !== 'object') throw new Error('no record');
  } catch {
    return new Response('bad payload', { status: 400 });
  }

  // Everything below comes from the public lead form — untrusted text.
  // It's escaped into the HTML body, and the reply-to is the only place
  // the lead's own email is used.
  const rows: [string, unknown][] = [
    ['Name', record.name],
    ['Email', record.email],
    ['Business', record.business_name],
    ['Phone', record.phone],
    ['Service', record.service_interested],
    ['Budget', record.budget_range],
    ['Message', record.message],
  ];

  const html = `
    <h2 style="margin:0 0 4px;">New lead: ${esc(record.name)}</h2>
    <p style="margin:0 0 16px;color:#555;">via the thelocaleyes.net contact form</p>
    <table cellpadding="6" style="border-collapse:collapse;">
      ${rows
        .map(
          ([label, val]) => `
        <tr>
          <td style="font-weight:bold;vertical-align:top;">${label}</td>
          <td>${esc(val) || '&mdash;'}</td>
        </tr>`
        )
        .join('')}
    </table>
    <p style="margin-top:20px;">
      <a href="https://thelocaleyes.net/admin.html">Open the leads dashboard &rarr;</a>
    </p>`;

  const leadEmail = typeof record.email === 'string' ? record.email : undefined;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('NOTIFY_FROM') || 'LocalEyes Leads <onboarding@resend.dev>',
      to: [to],
      reply_to: leadEmail,
      subject: `New lead: ${String(record.name ?? 'unknown')} — ${String(record.service_interested ?? 'no service picked')}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return new Response('send failed', { status: 502 });
  }
  return new Response('ok', { status: 200 });
});
