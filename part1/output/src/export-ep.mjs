// 出版準備: renders the captured vector pages (gulliver-epNN-output.build.test.ts → GM_OUT/pages/*.svg)
// as PNG per page and one PDF per episode, the way the editor's page export does (canvas-ui exportPages:
// PNG per page; PDF = each page at the page size × 0.75 pt, the capture manifest attached as
// references.json). The PDF embeds each page as JPEG (quality 92, same pixels as the PNG): pdf-lib stores
// PNG uncompressed-ish and a 16-page episode came to 110 MB. Run inside editor-platform (playwright, pdf-lib):
//   node export-ep.mjs <GM_OUT> <OUT_DIR> <name> [scale]
// Writes OUT_DIR/png/<name>-pNN.png, OUT_DIR/<name>.pdf and OUT_DIR/outputs.json (files, sizes, sha256).
// If GM_OUT/pages/colophon.html exists (the 奥付 with the AI disclosure, written by the output test), it is
// rendered at the page size as the episode's last page: OUT_DIR/png/<name>-colophon.png and the PDF's last page.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';

const [src, out, name, scaleArg] = process.argv.slice(2);
const scale = Number(scaleArg ?? 3);
const manifest = readFileSync(`${src}/pages/manifest.json`, 'utf8');
const svgs = readdirSync(`${src}/pages`).filter((f) => f.endsWith('.svg')).sort();
mkdirSync(`${out}/png`, { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');
const browser = await chromium.launch();
const files = [];
let size = [0, 0];
const pdf = await PDFDocument.create();
pdf.setTitle(name);
const colophon = existsSync(`${src}/pages/colophon.html`) ? readFileSync(`${src}/pages/colophon.html`, 'utf8') : null;
let pageW = 0, pageH = 0;
for (const [i, f] of [...svgs, ...(colophon ? ['colophon'] : [])].entries()) {
  const isColophon = f === 'colophon';
  const svg = isColophon ? colophon : readFileSync(`${src}/pages/${f}`, 'utf8');
  const w = isColophon ? pageW : Number(/width="([\d.]+)"/.exec(svg)[1]);
  const h = isColophon ? pageH : Number(/height="([\d.]+)"/.exec(svg)[1]);
  pageW = w; pageH = h;
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale })).newPage();
  await page.setContent(isColophon ? svg : `<html><body style="margin:0">${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h } });
  const file = isColophon ? `png/${name}-colophon.png` : `png/${name}-p${String(i + 1).padStart(2, '0')}.png`;
  writeFileSync(`${out}/${file}`, png);
  files.push({ file, format: 'PNG', page: isColophon ? 'colophon' : i + 1, width: Math.round(w * scale), height: Math.round(h * scale), bytes: png.length, sha256: sha(png) });
  const jpg = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: h }, type: 'jpeg', quality: 92 });
  const image = await pdf.embedJpg(jpg);
  const p = pdf.addPage([w * 0.75, h * 0.75]);
  p.drawImage(image, { x: 0, y: 0, width: p.getWidth(), height: p.getHeight() });
  size = [w * 0.75, h * 0.75];
  await page.context().close();
}
await browser.close();
await pdf.attach(new TextEncoder().encode(manifest), 'references.json', { mimeType: 'application/json', description: 'Exact committed artifact sources used by this export' });
const bytes = await pdf.save({ useObjectStreams: false });
writeFileSync(`${out}/${name}.pdf`, bytes);
files.push({ file: `${name}.pdf`, format: 'PDF', pages: svgs.length + (colophon ? 1 : 0), colophon: !!colophon, pointSize: size, embedded: 'JPEG q92', bytes: bytes.length, sha256: sha(bytes) });
writeFileSync(`${out}/outputs.json`, JSON.stringify({ name, scale, source: JSON.parse(manifest).source, files }, null, 1));
console.log(files.length, 'files');
