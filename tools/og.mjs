// tools/og.mjs — capture the 1200x630 social embed image
// usage: node tools/og.mjs [seed] [outPath]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import http from 'node:http';

const seed = process.argv[2] || '7';
const OUT = process.argv[3] || 'C:/trontstack/critters/og-image.png';
const PORT = 9334;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--headless=new',
  '--window-size=1200,630', '--hide-scrollbars', '--force-device-scale-factor=1',
  '--user-data-dir=' + process.env.TEMP + '/critters-og-profile',
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
const page = targets.find(t => t.type === 'page');
const ws = new (await import('ws')).default(page.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise(res => { pend.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.on('message', m => {
  const d = JSON.parse(m);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
});
await new Promise(r => ws.on('open', r));
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate', { url: `file:///C:/trontstack/critters/index.html?seed=${seed}` });
await sleep(3500);
await send('Runtime.evaluate', { expression: `
  CRITTERS.pause();
  document.getElementById('hint').style.display = 'none';
  document.getElementById('ui').style.display = 'none';
  'staged'
` });
await sleep(300);
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
console.log('saved', OUT, 'seed', seed);
chrome.kill();
