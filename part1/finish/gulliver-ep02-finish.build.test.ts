// Builds episode 2's black-and-white finish (a manga-workspace Design draft with the finish layers, the page table and the lettering
// record), checks it against fiction-manga@1.3.0 仕上げと写植 (finish.layers, finish.generated-sourced,
// lettering.traced, lettering.covered, lettering.clear), checks that no image was generated for it, captures the pages as SVG and writes everything as JSON
// (GM_OUT). Run with vitest from apps/artifact-host/src/creative/story-board/ next to gulliver-ep01/02-name.ts,
// gulliver-ep01-rough.ts, gulliver-ep01-ink.ts, gulliver-ep01/02-finish.ts, gulliver-part1-script.ts and the asset
// folders gulliver-ep02-stage/, gulliver-ep02-rough/, gulliver-ep02-ink/, gulliver-ep02-finish/ and gulliver-part1-artifacts/ (part1/script/artifacts
// and part1/editor/artifacts together).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { test, expect } from 'vitest';
import { captureDesignPages } from '@editor-platform/design/pagination';
import { commitVersion, type Artifact } from '@editor-platform/artifact-core';
import type { DesignContent, DesignElement } from '@editor-platform/design/model';
import { BALLOON_LAYER, FINISH_LAYERS, INK_LAYERS, LAYERS, type EpisodeStage, type StageInput } from './gulliver-ep01-name';
import { PART1_SCRIPT } from './gulliver-part1-script';
import type { EpisodeRough, RoughInput } from './gulliver-ep01-rough';
import type { EpisodeInk, InkInput } from './gulliver-ep01-ink';
import { EP02_NAME } from './gulliver-ep02-name';
import { FINISH_STAGE_LAYERS, forExport, isMono, SCRIPT_LINES_VERSION, SHADOW_MIN_SHARE, type EpisodeFinish, type FinishInput } from './gulliver-ep01-finish';
import { buildGulliverEp02Finish, INK_VERSION_EP02 as INK_VERSION } from './gulliver-ep02-finish';

const here = (p: string) => new URL(p, import.meta.url).pathname;
const STAGE = process.env.GM_STAGE ?? here('./gulliver-ep02-stage/');
const ROUGH = process.env.GM_ROUGH ?? here('./gulliver-ep02-rough/');
const INK = process.env.GM_INK ?? here('./gulliver-ep02-ink/');
const FIN = process.env.GM_FINISH ?? here('./gulliver-ep02-finish/');
const PART1 = process.env.GM_PART1 ?? here('./gulliver-part1-artifacts/');
const uri = (path: string, type: string) => `data:${type};base64,${readFileSync(path).toString('base64')}`;
type Rows = { rows: { id: string; values: Record<string, unknown> }[] };
const rowsOf = (a: Artifact<unknown>) => a.draft.content as Rows;

function load() {
  const sd = JSON.parse(readFileSync(`${STAGE}/ep02-stage.json`, 'utf8')) as EpisodeStage;
  const stage: StageInput = { data: sd, images: {} };
  const rd = JSON.parse(readFileSync(`${ROUGH}/ep02-rough.json`, 'utf8')) as EpisodeRough;
  const rough: RoughInput = { data: rd, images: {} };
  const id = JSON.parse(readFileSync(`${INK}/ep02-ink.json`, 'utf8')) as EpisodeInk;
  const ink: InkInput = { data: id, images: {} };
  for (const [pid, p] of Object.entries(id.panels)) for (const ly of Object.keys(p.layers)) ink.images[`${pid}/${ly}`] = '';
  const fd = JSON.parse(readFileSync(`${FIN}/ep02-finish.json`, 'utf8')) as EpisodeFinish;
  const fin: FinishInput = { data: fd, images: {} };
  for (const [pid, p] of Object.entries(fd.panels)) for (const [ly, f] of Object.entries(p.layers)) fin.images[`${pid}/${ly}`] = uri(`${FIN}/${f.image}`, 'image/webp');
  // The line layers enter the finish as lossless WebP copies of the accepted PNGs (part1/finish/lines/).
  for (const [pid, p] of Object.entries(fd.panels)) for (const [ly, f] of Object.entries(p.lines)) ink.images[`${pid}/${ly}`] = uri(`${FIN}/${f.image}`, 'image/webp');
  return { stage, rough, ink, fin };
}

test('episode 2 black-and-white finish has the finish layers, their sources, and a lettering record that covers the script', async () => {
  const { stage, rough, ink, fin } = load();
  const { build, artifacts } = await buildGulliverEp02Finish(stage, rough, ink, fin);
  const { content, records } = build;
  const els = content.elements;
  const byId = new Map(els.map((e) => [e.id, e]));
  const children = (id: string) => els.filter((e) => e.parentId === id);

  expect(new Set(records.map((r) => r.page)).size).toBe(EP02_NAME.length);
  expect(records.map((r) => r.id)).toEqual(stage.data.panels.map((p) => p.panel));
  expect(Object.keys(fin.data.panels).sort()).toEqual(records.map((r) => r.id).sort());

  // finish.layers: the art guide's stacking order LY-03..LY-08, then LY-10 and the memo; LY-09 balloons above.
  const layerNames = [FINISH_LAYERS.bgFill, INK_LAYERS.bg, FINISH_LAYERS.figFill, FINISH_LAYERS.shadow, INK_LAYERS.fig, INK_LAYERS.fx, LAYERS.text, LAYERS.memo];
  const covered: string[] = [];
  const noShadow: string[] = [];
  for (const r of records) {
    const all = children(r.id);
    const groups = all.slice(0, layerNames.length);
    expect(groups.map((g) => g.name), r.id).toEqual(layerNames);
    const [g03, g04, g05, g06, g07, g08, g10, gMemo] = groups as DesignElement[];
    expect(groups.some((g) => g.hidden), r.id).toBe(false);
    expect([g03, g04, g05, g06, g07, g08, gMemo].every((g) => g!.locked), r.id).toBe(true);
    expect(g10!.locked ?? false, r.id).toBe(false);
    const balloons = all.slice(layerNames.length);
    const present = [...groups.map((g) => g.name.slice(0, 5)), ...(balloons.length ? [BALLOON_LAYER] : [])];
    for (const ly of FINISH_STAGE_LAYERS)
      expect(present.includes(ly) || (ly === BALLOON_LAYER && !r.lines.some((l) => l.line.k === 'D' || l.line.k === 'N')), `${r.id} ${ly}`).toBe(true);
    // Each drawing layer is one panel-sized image with its generation record (finish.generated-sourced).
    for (const [g, type] of [[g03, 'webp'], [g04, 'webp'], [g05, 'webp'], [g06, 'webp'], [g07, 'webp'], [g08, 'webp']] as const) {
      const im = children(g!.id);
      expect(im.map((e) => e.type), `${r.id} ${g!.name}`).toEqual(['image']);
      expect(im[0]!.bounds).toEqual(byId.get(r.id)!.bounds);
      expect(im[0]!.src!.startsWith(`data:image/${type};base64,`), `${r.id} ${g!.name}`).toBe(true);
      const src = content.pagination!.images.find((i) => i.elementId === im[0]!.id);
      expect(src?.source, `${r.id} ${g!.name}`).toMatch(/sha256:[0-9a-f]{12}/);
      expect(src?.license).toContain('OpenAI');
      if (g === g03 || g === g05 || g === g06) {
        expect(src?.source).toContain(INK_VERSION);
        expect(src?.source).toContain(`part1/rough/panels/${r.id}.jpg`);
        expect(src?.source).toContain('no image generation');
      }
    }
    expect(isMono(fin.data.panels[r.id]!), r.id).toBe(true);
    if ((fin.data.panels[r.id]!.layers['LY-06'].share ?? 0) < SHADOW_MIN_SHARE) noShadow.push(r.id);
    for (const g of balloons) {
      expect(g.type, r.id).toBe('group');
      expect(g.name.startsWith(BALLOON_LAYER), `${r.id} ${g.name}`).toBe(true);
      expect(g.locked ?? false).toBe(false);
      expect(children(g.id).filter((e) => e.type === 'text').length, `${r.id} ${g.name}`).toBe(1);
    }
    // lettering.clear: no balloon, narration box or sound effect covers the head of a figure in frame.
    const b = byId.get(r.id)!.bounds;
    const boxes = [...balloons, ...children(g10!.id)].map((e) => e.bounds);
    for (const h of rough.data.panels[r.id]!.occupancy.heads) {
      const hx = b.x + h.x * b.width,
        hy = b.y + h.y * b.height;
      for (const x of boxes) if (hx >= x.x && hx <= x.x + x.width && hy >= x.y && hy <= x.y + x.height) covered.push(`${r.id} ${h.fg}`);
    }
  }
  expect(covered).toEqual([]);

  // Page table: every page records the ink, the setting art and the generation by fixed version.
  const pages = rowsOf(artifacts.find((a) => a.id === 'gm1-ep02-finish-pages')!);
  expect(pages.rows.length).toBe(16);
  for (const row of pages.rows) {
    const v = row.values as Record<string, string>;
    expect(v['fn.ink'], row.id).toContain(INK_VERSION);
    expect(v['fn.art'], row.id).toMatch(/^無し：白黒の仕上げは画像を生成しない/);
    expect(v['fn.method'], row.id).toMatch(/^白黒/);
    expect(v['fn.generated'], row.id).toMatch(/^仕上げのための画像生成は無い/);
    expect(v['fn.generated'], row.id).toContain('OpenAI');
    for (const ly of ['LY-01', 'LY-02', 'LY-06', 'LY-08', 'LY-10']) expect(v['fn.layerNotes'], row.id).toContain(ly);
  }
  expect(pages.rows.flatMap((row) => String(row.values['fn.noShadow'] ?? '').split('：')[0]!.split(' ').filter(Boolean))).toEqual(noShadow);
  for (const p of Object.values(fin.data.panels)) {
    expect(p.refs.filter((x) => x.path.startsWith('part1/ink/layers/')).length).toBe(3);
    expect(p.refs.filter((x) => x.path.startsWith('part1/rough/panels/')).length).toBe(1);
    expect(p.codexSession).toBeNull();
    for (const ref of p.refs) expect(ref.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(p.rawSha256).toMatch(/^[0-9a-f]{64}$/);
  }

  // lettering.traced: every row cites a line of the fixed script and a panel of this episode.
  const script = JSON.parse(readFileSync(`${PART1}/gm1-script-lines.artifact.json`, 'utf8')) as Artifact<Rows>;
  expect(script.versions.map((v) => `${script.id}@${v.versionId}`)).toContain(SCRIPT_LINES_VERSION);
  const lines = new Map(script.versions.find((v) => `${script.id}@${v.versionId}` === SCRIPT_LINES_VERSION)!.content.rows.map((r) => [r.id, r.values]));
  const lettering = rowsOf(artifacts.find((a) => a.id === 'gm1-ep02-lettering')!);
  const panelIds = new Set(records.map((r) => r.id));
  const cited = new Set<string>();
  for (const row of lettering.rows) {
    const v = row.values as Record<string, string>;
    expect(panelIds.has(v['lt.panel']!), row.id).toBe(true);
    const m = /^gm1-script-lines@script-v1 (SC-\d{3}\.L\d{2})$/.exec(v['lt.line']!);
    if (v['lt.kind'] === '題') continue;
    expect(m, `${row.id} ${v['lt.line']}`).not.toBeNull();
    const line = lines.get(m![1]!);
    expect(line, row.id).toBeDefined();
    expect(line!['ln.text'], row.id).toBe(v['lt.text']);
    cited.add(m![1]!);
  }
  // lettering.covered: every dialogue, narration and sound-effect line of episode 2 is lettered (ト書き is drawn, not lettered).
  const ep2 = PART1_SCRIPT.find((e) => e.n === 2)!;
  for (const sc of ep2.scenes)
    sc.lines.forEach((l, i) => {
      const id = `${sc.scene}.L${String(i + 1).padStart(2, '0')}`;
      if (l.k !== 'T') expect(cited.has(id), id).toBe(true);
    });
  // ...and no lettered text uses a notation the dictionary says not to use.
  const terms = JSON.parse(readFileSync(`${PART1}/gm1-terms.artifact.json`, 'utf8')) as Artifact<Rows>;
  const good = terms.draft.content.rows.flatMap((r) => String(r.values['te.text']).replace(/（[^）]*）/g, '').split('、'));
  const avoid = terms.draft.content.rows
    .map((r) => String(r.values['te.avoid'] ?? ''))
    .filter((t) => t && t !== '—' && !/[「。]/.test(t))
    .flatMap((t) => t.replace(/（[^）]*）/g, '').split('、'))
    .filter(Boolean);
  const misuse: string[] = [];
  for (const row of lettering.rows) {
    const text = String(row.values['lt.text']);
    for (const bad of avoid)
      for (let i = text.indexOf(bad); i >= 0; i = text.indexOf(bad, i + 1))
        if (!good.some((g) => g.length > bad.length && g.includes(bad) && text.slice(i - g.indexOf(bad), i - g.indexOf(bad) + g.length) === g)) misuse.push(`${row.id} ${bad}`);
  }
  expect(misuse).toEqual([]);

  // The draft captures as 16 vector pages with no error diagnostics; the export hides the memo groups.
  const design = artifacts.find((a) => a.id === 'gm1-ep02-finish')! as Artifact<DesignContent>;
  const exported = { ...design, draft: { ...design.draft, content: forExport(design.draft.content) } };
  const committed = await commitVersion({ ...exported, versions: [] } as never, null, '仕上げ 第2話');
  const capture = await captureDesignPages(committed as never, (committed as Artifact<DesignContent>).versions[0].versionId, { mode: 'vector' });
  expect(capture.ok, JSON.stringify(capture.manifest.diagnostics)).toBe(true);
  expect(capture.pages.length).toBe(16);
  const svg = capture.pages.map((p) => p.svg).join('');
  for (const r of records) expect(svg.includes(`絵：${r.panel.art}`.slice(0, 20)), r.id).toBe(false);
  // The Playground imports at most 16 MB.
  expect(JSON.stringify(design).length, 'design artifact size').toBeLessThan(16 * 1024 * 1024);

  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    mkdirSync(`${out}/pages`, { recursive: true });
    for (const a of artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/finish-editor.json`, JSON.stringify({ artifacts }));
    capture.pages.forEach((p, i) => writeFileSync(`${out}/pages/page-${String(i + 1).padStart(2, '0')}.svg`, p.svg));
    writeFileSync(`${out}/pages/manifest.json`, JSON.stringify(capture.manifest, null, 1));
  }
}, 240_000);
