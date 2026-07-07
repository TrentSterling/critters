// tools/inspect.mjs — multi-angle visual inspector: orbit a critter, shoot from N angles
// usage: node tools/inspect.mjs <name> <url-suffix> <setupExpr> [angles=6] [dist=3.2]
// setupExpr must leave the subject as the LAST critter or return an index; shots land in verify/inspect/
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import http from 'node:http';

const [name = 'subject', suffix = '', setup = '', anglesArg = '6', distArg = '3.2'] = process.argv.slice(2);
const ANGLES = parseInt(anglesArg, 10);
const DIST = parseFloat(distArg);
const PORT = 9335;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = suffix.startsWith('http') ? suffix : 'file:///C:/trontstack/critters/index.html' + suffix;

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--headless=new',
  '--window-size=640,420', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--user-data-dir=' + process.env.TEMP + '/critters-inspect-profile',
  'about:blank',
], { stdio: 'ignore' });

const get = p => new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}${p}`, r => {
  let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
}).on('error', rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));

let targets = null;
for (let tries = 0; tries < 20 && !targets; tries++) { await sleep(400); targets = await get('/json').catch(() => null); }
const page = targets.find(t => t.type === 'page');
const ws = new (await import('ws')).default(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
let id = 0; const pend = new Map(); const errors = [];
const send = (method, params = {}) => new Promise(res => { pend.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.on('message', m => {
  const d = JSON.parse(m);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text);
});
await new Promise(r => ws.on('open', r));
await send('Runtime.enable'); await send('Page.enable');
await send('Page.navigate', { url: URL });
await sleep(2500);

// setup returns the subject index (or we use the last critter)
const su = await send('Runtime.evaluate', {
  expression: `(async () => { const r = (${setup || 'null'}); const v = await Promise.resolve(r); return (typeof v === 'number') ? v : CRITTERS.list.length - 1; })()`,
  returnByValue: true, awaitPromise: true,
});
const idx = su.result?.value ?? 0;
await send('Runtime.evaluate', { expression: `CRITTERS.pause(); document.getElementById('hint').style.display='none'; document.getElementById('ui').style.display='none';` });

mkdirSync('C:/trontstack/critters/verify/inspect', { recursive: true });
for (let a = 0; a < ANGLES; a++) {
  const theta = (a / ANGLES) * Math.PI * 2;
  const h = a % 2 === 0 ? 0.35 : 0.12; // alternate eye-level and low angle (silhouette artifacts show low)
  await send('Runtime.evaluate', { expression: `CRITTERS.view(${idx}, ${theta.toFixed(3)}, ${DIST}, ${h}); CRITTERS.step(16);` });
  await sleep(180);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`C:/trontstack/critters/verify/inspect/${name}_a${a}.png`, Buffer.from(shot.data, 'base64'));
}
console.log(JSON.stringify({ name, subject: idx, angles: ANGLES, errors }));
chrome.kill();
process.exit(errors.length ? 1 : 0);
