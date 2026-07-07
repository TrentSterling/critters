// tools/sweep.mjs — permutation sweep: seeds x archetypes, face close-up per combo
// usage: node tools/sweep.mjs [seedList] [archList] [dist]
//   node tools/sweep.mjs 3,7,21,77 serpent,multiped 2.6
// Shots land in verify/sweep/<arch>_s<seed>.png (camera aimed at the FACE).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import http from 'node:http';

const seeds = (process.argv[2] || '3,7,21,77').split(',').map(Number);
const arches = (process.argv[3] || 'biped,quadruped,multiped,hopper,flyer,serpent').split(',');
const DIST = parseFloat(process.argv[4] || '2.6');
const PORT = 9336;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const get = p => new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}${p}`, r => {
  let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
}).on('error', rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));

mkdirSync('C:/trontstack/critters/verify/sweep', { recursive: true });
const report = [];

for (const seed of seeds) {
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`, '--headless=new',
    '--window-size=560,380', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--user-data-dir=' + process.env.TEMP + '/critters-sweep-profile',
    'about:blank',
  ], { stdio: 'ignore' });

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
  await send('Page.navigate', { url: `file:///C:/trontstack/critters/index.html?seed=${seed}` });
  await sleep(2500);
  await send('Runtime.evaluate', { expression: `document.getElementById('hint').style.display='none'; document.getElementById('ui').style.display='none';` });

  for (const arch of arches) {
    // spawn the subject, wait for the pop-in, then park the camera in FRONT of its face
    const r = await send('Runtime.evaluate', {
      expression: `(async () => {
        const c = CRITTERS.spawn('${arch}');
        const i = CRITTERS.list.indexOf(c);
        await new Promise(r => setTimeout(r, 700));
        CRITTERS.pause();
        CRITTERS.view(i, c.heading, ${DIST}, 0.22); // camera at azimuth = heading -> looking at the face
        return { i, eyes: c.eyes.length };
      })()`,
      returnByValue: true, awaitPromise: true,
    });
    await sleep(200);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`C:/trontstack/critters/verify/sweep/${arch}_s${seed}.png`, Buffer.from(shot.data, 'base64'));
    report.push({ arch, seed, eyes: r.result?.value?.eyes ?? -1 });
    await send('Runtime.evaluate', { expression: 'CRITTERS.resume()' });
  }
  if (errors.length) report.push({ seed, errors });
  chrome.kill();
  await sleep(400);
}
console.log(JSON.stringify(report, null, 1));
