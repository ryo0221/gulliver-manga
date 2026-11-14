// Renders the captured page SVGs as PNG (run inside editor-platform): node svg2png.mjs <svg dir> <png dir>
import { readdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const [src, dst] = process.argv.slice(2);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 800, height: 1180 } })).newPage();
for (const f of (await readdir(src)).filter((f) => f.endsWith('.svg')).sort()) {
  await p.setContent(`<html><body style="margin:0">${await readFile(`${src}/${f}`, 'utf8')}</body></html>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${dst}/${f.replace('.svg', '.png')}` });
}
await b.close();
