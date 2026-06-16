// Headless browser driver for manual verification (no test-framework dep).
// Launches Edge with the DevTools protocol, optionally evaluates a JS snippet in
// the page (to click buttons etc.), then writes a screenshot.
//
// Usage:
//   EVAL="<js>" WAIT=3000 AFTER=2500 node scripts/cdp-drive.mjs <url> <out.png>
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import fs from 'node:fs';

const EDGE =
  process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const url = process.argv[2];
const out = process.argv[3] || 'shot.png';
const evalExpr = process.env.EVAL || '';
const waitMs = Number(process.env.WAIT || 3500);
const afterMs = Number(process.env.AFTER || 2500);
const port = Number(process.env.PORT || 9333);

const extraFlags = (process.env.EXTRA_FLAGS || '').split(/\s+/).filter(Boolean);
const edge = spawn(
  EDGE,
  [
    '--headless=new',
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--window-size=${process.env.WINDOW || '1280,900'}`,
    '--no-first-run',
    ...extraFlags,
    url,
  ],
  { stdio: 'ignore' },
);

let target;
for (let i = 0; i < 80; i++) {
  try {
    const r = await fetch(`http://localhost:${port}/json/list`);
    const list = await r.json();
    target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (target) break;
  } catch {
    // devtools not ready yet
  }
  await sleep(250);
}
if (!target) {
  console.error('No DevTools target found');
  edge.kill();
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
await new Promise((r) => ws.addEventListener('open', r));
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});

await send('Page.enable');
await send('Runtime.enable');

const logs = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Runtime.consoleAPICalled') {
    const text = (m.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ');
    logs.push(`[${m.params.type}] ${text}`);
  } else if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    logs.push(`[exception] ${d.exception?.description || d.text}`);
  }
});

await sleep(waitMs);

if (evalExpr) {
  const r = await send('Runtime.evaluate', {
    expression: evalExpr,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log('EVAL:', JSON.stringify(r.result?.value ?? r.exceptionDetails?.text ?? r.result?.description ?? null));
  await sleep(afterMs);
}

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('wrote', out);
if (process.env.LOGS && logs.length) {
  console.log('--- console ---');
  for (const l of logs.slice(-25)) console.log(l);
}
ws.close();
edge.kill();
process.exit(0);
