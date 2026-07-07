// tools/verify.mjs — headless Chrome via CDP (chrome --screenshot is broken on this machine)
// usage: node tools/verify.mjs <name> [url-suffix-or-full-url] [js-expression] [--mobile]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import http from 'node:http';

const args = process.argv.slice(2).filter(a => a !== '--mobile');
const MOBILE = process.argv.includes('--mobile');
const [name = 'shot', suffix = '', expr = ''] = args;
const PORT = 9333;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = suffix.startsWith('http')
  ? suffix
  : 'file:///C:/trontstack/critters/index.html' + suffix;

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--headless=new',
  '--window-size=1280,800', '--hide-scrollbars',
  '--user-data-dir=' + process.env.TEMP + '/critters-verify-profile',
  'about:blank',
], { stdio: 'ignore' });

const get = p => new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}${p}`, r => {
  let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
}).on('error', rej));

const sleep = ms => new Promise(r => setTimeout(r, ms));

let targets = null;
for (let tries = 0; tries < 20 && !targets; tries++) {
  await sleep(400);
  targets = await get('/json').catch(() => null);
}
if (!targets) { console.error('chrome CDP never came up'); chrome.kill(); process.exit(2); }

const page = targets.find(t => t.type === 'page');
const ws = new (await import('ws')).default(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise(res => { pend.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
const errors = [];
ws.on('message', m => {
  const d = JSON.parse(m);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error')
    errors.push(d.params.args.map(a => a.value ?? a.description).join(' '));
  if (d.method === 'Runtime.exceptionThrown')
    errors.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || ''));
});
await new Promise(r => ws.on('open', r));
await send('Runtime.enable'); await send('Page.enable');
if (MOBILE) {
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
}
await send('Page.navigate', { url: URL });
await sleep(2500);
let result = null;
if (expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  result = r.result?.value ?? r.result?.description ?? null;
  await sleep(300); // let any visual reaction settle before the shot
}
const shot = await send('Page.captureScreenshot', { format: 'png' });
mkdirSync('C:/trontstack/critters/verify', { recursive: true });
writeFileSync(`C:/trontstack/critters/verify/${name}.png`, Buffer.from(shot.data, 'base64'));
console.log(JSON.stringify({ name, errors, result }, null, 2));
chrome.kill();
process.exit(errors.length ? 1 : 0);
