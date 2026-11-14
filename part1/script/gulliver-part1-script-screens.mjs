// Opens the part 1 script (built by gulliver-part1-script.build.test.ts) in the Editor Platform
// Playground and saves screenshots. Needs a running Playground dev server (see README) and must run
// from inside editor-platform so that `playwright` resolves:
//   node gulliver-part1-script-screens.mjs <script-editor.json> <out dir> [base url]
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [json = '/tmp/claude-0/script/script-editor.json', dir = '/tmp/claude-0/script/screens', base = 'http://127.0.0.1:4231'] =
  process.argv.slice(2);
const { artifacts } = JSON.parse(await readFile(json, 'utf8'));
await mkdir(dir, { recursive: true });
const browser = await browser_();
async function browser_() {
  return chromium.launch();
}
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.setDefaultTimeout(60_000);

async function shot(name) {
  await page.mouse.move(720, 890);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${dir}/${name}.png` });
}
/** The Playground opens a native artifact through its own import (it keeps the content as is). */
async function open(id) {
  const artifact = artifacts.find((a) => a.id === id);
  await page.goto(base + '/');
  const input = page.getByLabel('Import artifact', { exact: true });
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Toggle library', exact: true }).click();
  await input.setInputFiles({ name: `${id}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(artifact)) });
  await page.getByLabel('Artifact name').waitFor();
  const close = page.getByRole('button', { name: 'Close library panel', exact: true });
  if (await close.isVisible()) await close.click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape'));
}

await open('gm1-script');
await shot('01-script');
// Further into the script: episode 5's secret council (the "mercy" of blinding).
for (const [text, name] of [
  ['SC-015', '02-script-ep5'],
  ['SC-020', '03-script-ep6'],
]) {
  const h = page.getByText(new RegExp(`^${text} `)).first();
  await h.scrollIntoViewIfNeeded();
  await h.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await shot(name);
}
await open('gm1-script-lines');
await shot('04-script-lines');
await browser.close();
