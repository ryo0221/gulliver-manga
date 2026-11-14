// Drags a balloon and then the drawing in the finish Design (Playground dev server needed; run inside editor-platform):
//   node gulliver-ep01-finish-drag.mjs <finish-editor.json> <out dir> [base url]
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const [json, dir, base = 'http://127.0.0.1:4231'] = process.argv.slice(2);
const { artifacts } = JSON.parse(await readFile(json, 'utf8'));
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
page.setDefaultTimeout(60_000);
const artifact = artifacts.find((a) => a.id === 'gm1-ep01-finish');
await page.goto(base + '/');
const input = page.getByLabel('Import artifact', { exact: true });
if (!(await input.isVisible())) await page.getByRole('button', { name: 'Toggle library', exact: true }).click();
await input.setInputFiles({ name: 'ink.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(artifact)) });
await page.getByLabel('Artifact name').waitFor();
const close = page.getByRole('button', { name: 'Close library panel', exact: true });
if (await close.isVisible()) await close.click({ timeout: 5000 }).catch(() => page.keyboard.press('Escape'));
await page.getByRole('button', { name: '漫画ワークスペース', exact: true }).click();
await page.getByRole('button', { name: 'ページ 9', exact: true }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${dir}/08a-before-drag.png` });
// Drag the うおっ! balloon (page 9 panel 3) to the right.
await page.mouse.move(560, 812); await page.mouse.down();
for (let i = 1; i <= 10; i++) await page.mouse.move(560 + i * 18, 812 - i * 3);
await page.mouse.up();
await page.waitForTimeout(800);
await page.mouse.move(800, 990); await page.waitForTimeout(600);
await page.screenshot({ path: `${dir}/08-drag-balloon.png` });
// Drag on the drawing: it is locked, so nothing should move.
await page.mouse.move(760, 600); await page.mouse.down();
for (let i = 1; i <= 10; i++) await page.mouse.move(760 + i * 10, 600 + i * 6);
await page.mouse.up(); await page.waitForTimeout(800);
await page.mouse.move(800, 990); await page.waitForTimeout(600);
await page.screenshot({ path: `${dir}/09-drag-drawing.png` });
await browser.close();
