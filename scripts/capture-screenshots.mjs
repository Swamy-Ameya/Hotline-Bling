import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'deck/assets/screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Find Chrome or Edge
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const chromePath = chromePaths.find((p) => fs.existsSync(p));
if (!chromePath) {
  console.error('No Chrome/Edge executable found!');
  process.exit(1);
}
console.log('Using browser:', chromePath);

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const { WebSocket } = await import('ws').catch(() => ({ WebSocket: globalThis.WebSocket }));
    if (!WebSocket) throw new Error('No WebSocket implementation available');
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function capture() {
  console.log('Starting Next.js production server on port 3000...');
  const nextProcess = spawn('npx.cmd', ['next', 'start', '-p', '3000'], {
    cwd: rootDir,
    stdio: 'ignore',
    shell: true,
    env: { ...process.env, PATH: `C:\\Users\\lenovo\\AppData\\Local\\nodejs;${process.env.PATH}` },
  });

  // Wait for server to start
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      await fetchJson('http://localhost:3000/api/detect');
      ready = true;
      break;
    } catch {
      await wait(500);
    }
  }

  if (!ready) {
    console.error('Server failed to start on port 3000');
    nextProcess.kill();
    process.exit(1);
  }
  console.log('Server is ready!');

  const port = 9222;
  const chromeProcess = spawn(
    chromePath,
    [
      `--remote-debugging-port=${port}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--window-size=1600,900',
      'about:blank',
    ],
    { shell: false },
  );

  await wait(2000);

  const targets = await fetchJson(`http://localhost:${port}/json`);
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  console.log('Connecting to browser WebSocket:', pageTarget.webSocketDebuggerUrl);

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1600,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const scenarios = [
    { id: 'filter_fault', filename: 'radar-filter-fault.png' },
    { id: 'coincidence', filename: 'radar-coincidence.png' },
    { id: 'food', filename: 'radar-food.png' },
    { id: 'quiet', filename: 'radar-quiet.png' },
  ];

  for (const s of scenarios) {
    console.log(`Navigating to /radar for scenario: ${s.id}...`);
    // Seed the scenario via API
    await fetch('http://localhost:3000/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: s.id }),
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:3000/radar' });
    await wait(1500);

    // Switch scenario in UI
    await cdp.send('Runtime.evaluate', {
      expression: `
        document.documentElement.classList.add('dark');
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.includes('${s.id}'));
        if (btn) btn.click();
      `,
    });

    await wait(1000);

    if (s.id === 'coincidence') {
      await cdp.send('Runtime.evaluate', {
        expression: `
          const contrastSection = document.querySelector('section[aria-label="Statistical Contrast Panel"]');
          if (contrastSection) {
            contrastSection.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        `,
      });
      await wait(500);
    } else {
      await cdp.send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: 0, behavior: 'instant' });`,
      });
      await wait(500);
    }

    console.log(`Capturing screenshot 1600x900 for ${s.filename}...`);
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    const filePath = path.join(outDir, s.filename);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot to: ${filePath}`);
  }

  // Capture Student Portal view
  console.log('Capturing Student Portal view for report-form-mobile.png...');
  await cdp.send('Runtime.evaluate', {
    expression: `
      const studentBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Student Portal'));
      if (studentBtn) studentBtn.click();
      window.scrollTo({ top: 0, behavior: 'instant' });
    `,
  });
  await wait(1000);

  const { data: studentData } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  const studentPath = path.join(outDir, 'report-form-mobile.png');
  fs.writeFileSync(studentPath, Buffer.from(studentData, 'base64'));
  console.log(`Saved screenshot to: ${studentPath}`);

  cdp.close();
  chromeProcess.kill();
  nextProcess.kill();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
