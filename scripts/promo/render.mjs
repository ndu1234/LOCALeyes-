// Render scripts/promo/promo.html to MP4 (and a poster JPG) with headless
// Chrome + ffmpeg. No npm packages: talks to Chrome over the DevTools
// protocol using Node's built-in WebSocket (Node 22+).
//
// Needs the dev server running (bash scripts/serve.sh) so the page can load
// assets/logo.png, plus ffmpeg on PATH.
//
//   node scripts/promo/render.mjs                 full render → videos/
//   node scripts/promo/render.mjs --stills 1,3,7  PNG stills → scratch dir
//
// Outputs:
//   videos/localeyes-promo-1080.mp4   1080×1920 master (social / download)
//   videos/localeyes-promo.mp4        720×1280 web cut used on landing.html
//   assets/promo-poster.jpg           first-beat still shown before playback

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const URL = process.env.PROMO_URL || 'http://localhost:8080/scripts/promo/promo.html?render';
const FPS = 30;
const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'promo-chrome-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--hide-scrollbars', '--mute-audio', '--force-device-scale-factor=1',
    '--window-size=1080,1920', 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return { proc, ws: page.webSocketDebuggerUrl };
    } catch {}
    await sleep(200);
  }
  proc.kill();
  throw new Error('Chrome did not start');
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method) listeners.forEach(l => l(msg));
  };
  const ready = new Promise(r => (ws.onopen = r));
  return {
    ready,
    send: (method, params = {}) => new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, { res, rej });
      ws.send(JSON.stringify({ id: n, method, params }));
    }),
    once: method => new Promise(r => listeners.push(m => m.method === method && r(m))),
    close: () => ws.close(),
  };
}

async function main() {
  const { proc, ws } = await launch();
  const c = cdp(ws);
  await c.ready;
  try {
    await c.send('Page.enable');
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
    const loaded = c.once('Page.loadEventFired');
    await c.send('Page.navigate', { url: URL });
    await loaded;
    await c.send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
    const { result } = await c.send('Runtime.evaluate', { expression: 'window.DURATION' });
    const duration = result.value;
    if (!duration) throw new Error('promo page did not expose window.DURATION — is the dev server running?');

    const shot = async (t, format = 'png') => {
      await c.send('Runtime.evaluate', { expression: `renderAt(${t})` });
      const { data } = await c.send('Page.captureScreenshot', {
        format, quality: format === 'jpeg' ? 90 : undefined,
        clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 },
      });
      return Buffer.from(data, 'base64');
    };

    if (stillsArg) {
      const dir = outDir || mkdtempSync(join(tmpdir(), 'promo-stills-'));
      for (const t of stillsArg.split(',').map(Number)) {
        const p = join(dir, `t${String(t).replace('.', '_')}.png`);
        writeFileSync(p, await shot(t));
        console.log(p);
      }
      return;
    }

    // Master: stream PNG frames into ffmpeg.
    const master = join(ROOT, 'videos/localeyes-promo-1080.mp4');
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', master,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const frames = Math.round(duration * FPS);
    for (let f = 0; f < frames; f++) {
      const buf = await shot(f / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 30 === 0) process.stdout.write(`\rframe ${f}/${frames}`);
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', code => code === 0 ? r() : j(new Error('ffmpeg failed'))));
    console.log(`\n${master}`);

    // Web cut: smaller, still sharp on a retina phone.
    const web = join(ROOT, 'videos/localeyes-promo.mp4');
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', master, '-vf', 'scale=720:1280:flags=lanczos',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', web]);
    console.log(web);

    // Poster: the fully built HUD beat.
    const poster = join(ROOT, 'assets/promo-poster.jpg');
    const png = join(mkdtempSync(join(tmpdir(), 'promo-poster-')), 'p.png');
    writeFileSync(png, await shot(4.4));
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-vf', 'scale=720:1280:flags=lanczos', '-q:v', '4', poster]);
    console.log(poster);
  } finally {
    c.close();
    proc.kill();
  }
}

function run(cmd, a) {
  return new Promise((r, j) => spawn(cmd, a, { stdio: 'inherit' }).on('close', code => code === 0 ? r() : j(new Error(`${cmd} failed`))));
}

if (!existsSync(CHROME)) { console.error(`Chrome not found at ${CHROME} (set CHROME=...)`); process.exit(1); }
main().catch(e => { console.error(e.message); process.exit(1); });
