// Opens episode 1's finish (built by gulliver-ep01-finish.build.test.ts) in the Editor Platform
// Playground's manga workspace and saves screenshots. Needs a running Playground dev server (see
// README) and must run from inside editor-platform so that `playwright` resolves:
//   node gulliver-ep01-finish-screens.mjs <finish-editor.json> <out dir> [base url]
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [json, dir, base = 'http://127.0.0.1:4231'] = process.argv.slice(2);
const { artifacts } = JSON.parse(await readFile(json, 'utf8'));
await mkdir(dir, { recursive: true });
const browser = await chromium.launch();

async function session() {
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  page.setDefaultTimeout(60_000);
  return page;
}
async function shot(page, name) {
  await page.mouse.move(800, 990);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/${name}.png` });
}
/** The Playground opens a native artifact through its own import (it keeps the content as is). */
async function open(page, id) {
  const artifact = artifacts.find((a) => a.id === id);
  await page.goto(base + '/');
  const input = page.getByLabel('Import artifact', { exact: true });
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Toggle library', exact: true }).click();
  await input.setInputFiles({ name: `${id}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(artifact)) });
  await page.getByLabel('Artifact name').waitFor();
  const close = page.getByRole('button', { name: 'Close library panel', exact: true });
  if (await close.isVisible()) await close.click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape'));
}

let page = await session();
await open(page, 'gm1-ep01-finish');
await page.getByRole('button', { name: '漫画ワークスペース', exact: true }).click();
for (const [n, name] of [
  [1, '01-workspace-page01'],
  [9, '02-workspace-page09'],
  [15, '03-workspace-page15'],
]) {
  await page.getByRole('button', { name: `ページ ${n}`, exact: true }).click();
  await shot(page, name);
}
await page.getByRole('button', { name: 'ページ 8', exact: true }).click();
await page.getByRole('button', { name: '見開き', exact: true }).click();
await page.getByRole('region', { name: '漫画の通読' }).waitFor();
await shot(page, '04-spread-p08-09');
await page.getByRole('button', { name: '通読を閉じる', exact: true }).click();
await page.getByRole('button', { name: '通読', exact: true }).click();
const reading = page.getByRole('region', { name: '漫画の通読' });
await reading.waitFor();
await shot(page, '05-reading');
await page.close();

page = await session();
await open(page, 'gm1-ep01-finish-pages');
await shot(page, '06-page-table');
await page.close();

page = await session();
await open(page, 'gm1-ep01-lettering');
await shot(page, '07-lettering');
await page.close();

await browser.close();
