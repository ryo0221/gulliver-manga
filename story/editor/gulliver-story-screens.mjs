// Opens the whole-story artifacts (built by gulliver-story.build.test.ts) in the Editor Platform
// Playground and saves screenshots. Needs a running Playground dev server:
//   npx vite --host 127.0.0.1 --port 4231 --strictPort   (in editor-platform)
//   node gulliver-story-screens.mjs <story-editor.json> <out dir> [base url]
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [json = '/tmp/claude-0/story/story-editor.json', dir = '/tmp/claude-0/story/screens', base = 'http://127.0.0.1:4231'] =
  process.argv.slice(2);
const story = JSON.parse(await readFile(json, 'utf8'));
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();
let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(60_000);

async function shot(name, full = false) {
  await page.mouse.move(720, 890);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: full });
}

/** Put the artifacts and the Story links into this origin's storage, then reload. */
async function seed(path) {
  await page.goto(base + path);
  await page.evaluate(async ({ artifacts, links }) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('editor-platform', 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('artifacts')) request.result.createObjectStore('artifacts', { keyPath: 'id' });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result,
          tx = db.transaction('artifacts', 'readwrite');
        for (const a of artifacts) tx.objectStore('artifacts').put(a);
        tx.oncomplete = () => (db.close(), resolve());
        tx.onerror = () => reject(tx.error);
      };
    });
    localStorage.setItem('story-timeline:links', JSON.stringify(links));
    localStorage.setItem('story-board:links', JSON.stringify(links));
  }, story);
  await page.reload();
}

/** The Playground opens a native artifact through its own import (it keeps the content as is). */
// Seeded Story storage makes the Playground's own start page crash, so the Playground gets a fresh
// browser context (its own empty storage) and opens each artifact through its import.
async function openInPlayground(id) {
  const artifact = story.artifacts.find((a) => a.id === id);
  if (!page.playground) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    page.setDefaultTimeout(60_000);
    page.playground = true;
  }
  await page.goto(base + '/');
  const input = page.getByLabel('Import artifact', { exact: true });
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Toggle library', exact: true }).click();
  await input.setInputFiles({ name: `${id}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(artifact)) });
  await page.getByLabel('Artifact name').waitFor();
  const close = page.getByRole('button', { name: 'Close library panel', exact: true });
  if (await close.isVisible()) await close.click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape'));
}

const only = process.env.ONLY;
if (!only || only === 'timeline') {
  await seed('/story-timeline.html');
  await page.waitForTimeout(4000);
  await shot('01-story-timeline');
  await shot('01-story-timeline-full', true);
  // An event's detail: what it follows from and which scenes present it.
  await page.getByText('秘密の会議で弾劾が決まり', { exact: false }).first().click();
  await shot('01-story-timeline-event');
  // 構成図: the 24 episodes in presentation order.
  await page.getByRole('button', { name: '構成の提示順', exact: true }).or(page.getByRole('tab', { name: '構成の提示順', exact: true })).first().click();
  await page.waitForTimeout(1500);
  await shot('02-composition');
  await shot('02-composition-full', true);
  // The prologue scene placed again in episode 24.
  const reprise = page.getByText('SC-001（再び）', { exact: false }).first();
  await reprise.scrollIntoViewIfNeeded();
  await reprise.click();
  await shot('02-composition-reprise');
}
if (!only || only === 'data') {
  for (const [id, file] of [
    ['gms-outline', '03-outline'],
    ['gms-plot', '04-plot'],
    ['gms-scenes', '05-scenes'],
    ['gms-ledger', '06-ledger'],
    ['gms-composition', '07-composition-table'],
    ['gms-characters', '08-characters'],
  ]) {
    await openInPlayground(id);
    await shot(file);
  }
}
await browser.close();
