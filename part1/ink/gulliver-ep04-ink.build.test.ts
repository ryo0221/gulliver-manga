// Builds episode 4's line art (a manga-workspace Design draft with the ink layers + the page table), checks it
// against fiction-manga@1.3.0 線画 (ink.layers) and lettering.clear, captures the pages as SVG and writes
// everything as JSON (GM_OUT). Run with vitest from apps/artifact-host/src/creative/story-board/ next to
// gulliver-ep01/02-name.ts, gulliver-ep01-rough.ts, gulliver-ep01/02-ink.ts, gulliver-part1-script.ts, the stage
// (gulliver-ep04-stage/), the rough assets (gulliver-ep04-rough/) and the ink assets (gulliver-ep04-ink/).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { test, expect } from 'vitest';
import { captureDesignPages } from '@editor-platform/design/pagination';
import { commitVersion, type Artifact } from '@editor-platform/artifact-core';
import type { DesignContent, DesignElement } from '@editor-platform/design/model';
import { BALLOON_LAYER, INK_LAYERS, LAYERS, type EpisodeStage, type StageInput } from './gulliver-ep01-name';
import { EP04_NAME } from './gulliver-ep04-name';
import type { EpisodeRough, RoughInput } from './gulliver-ep01-rough';
import { BG_MIN_SHARE, forExport, INK_STAGE_LAYERS, type EpisodeInk, type InkInput } from './gulliver-ep01-ink';
import { buildGulliverEp04Ink, ROUGH_VERSION_EP04 as ROUGH_VERSION } from './gulliver-ep04-ink';

const here = (p: string) => new URL(p, import.meta.url).pathname;
const STAGE = process.env.GM_STAGE ?? here('./gulliver-ep04-stage/');
const ROUGH = process.env.GM_ROUGH ?? here('./gulliver-ep04-rough/');
const INK = process.env.GM_INK ?? here('./gulliver-ep04-ink/');
const uri = (path: string, type: string) => `data:${type};base64,${readFileSync(path).toString('base64')}`;
function loadStage(): StageInput {
  const data = JSON.parse(readFileSync(`${STAGE}/ep04-stage.json`, 'utf8')) as EpisodeStage;
  return { data, images: Object.fromEntries(data.panels.filter((p) => p.underlay).map((p) => [p.panel, uri(`${STAGE}/${p.underlay}`, 'image/jpeg')])) };
}
function loadRough(): RoughInput {
  const data = JSON.parse(readFileSync(`${ROUGH}/ep04-rough.json`, 'utf8')) as EpisodeRough;
  return { data, images: Object.fromEntries(Object.entries(data.panels).map(([id, p]) => [id, uri(`${ROUGH}/${p.image}`, 'image/jpeg')])) };
}
function loadInk(): InkInput {
  const data = JSON.parse(readFileSync(`${INK}/ep04-ink.json`, 'utf8')) as EpisodeInk;
  const images: Record<string, string> = {};
  for (const [id, p] of Object.entries(data.panels)) for (const [ly, f] of Object.entries(p.layers)) images[`${id}/${ly}`] = uri(`${INK}/${f.image}`, 'image/png');
  return { data, images };
}

test('episode 4 line art has the ink layers, their sources, and movable lettering clear of the heads', async () => {
  const stage = loadStage();
  const rough = loadRough();
  const ink = loadInk();
  // LY-01 and LY-02 are hidden in the line art: they enter the draft as small copies (part1/ink/hidden/) to keep the
  // Design under the Playground's 16 MB import limit.
  const hidden = (ly: string) => Object.fromEntries(Object.keys(rough.images).map((id) => [id, uri(`${INK}/hidden/${id}-${ly}.jpg`, 'image/jpeg')]));
  const { build, artifacts } = await buildGulliverEp04Ink({ ...stage, images: hidden('LY-01') }, { ...rough, images: hidden('LY-02') }, ink);
  const { content, records } = build;
  const els = content.elements;
  const byId = new Map(els.map((e) => [e.id, e]));
  const children = (id: string) => els.filter((e) => e.parentId === id);

  // Same pages and panels as the ネーム and the rough (PN ids kept); every panel is inked.
  expect(new Set(records.map((r) => r.page)).size).toBe(EP04_NAME.length);
  expect(records.map((r) => r.id)).toEqual(stage.data.panels.map((p) => p.panel));
  expect(Object.keys(ink.data.panels).sort()).toEqual(records.map((r) => r.id).sort());

  const layerNames = [LAYERS.underlay, LAYERS.atari, INK_LAYERS.bg, INK_LAYERS.fig, INK_LAYERS.fx, LAYERS.text, LAYERS.memo];
  const covered: string[] = [];
  const noBg: string[] = [];
  for (const r of records) {
    // ink.layers: every panel has the ink-stage layers of the art guide in stacking order; LY-01 and LY-02 kept hidden.
    const all = children(r.id);
    const groups = all.slice(0, layerNames.length);
    expect(groups.map((g) => g.name), r.id).toEqual(layerNames);
    const [g01, g02, g04, g07, g08, g10, gMemo] = groups as DesignElement[];
    expect([g01, g02].every((g) => g!.hidden), r.id).toBe(true);
    expect([g04, g07, g08, g10, gMemo].some((g) => g!.hidden), r.id).toBe(false);
    // The drawing layers and the memo are locked so that dragging a balloon never moves the drawing.
    expect([g01, g02, g04, g07, g08, gMemo].every((g) => g!.locked), r.id).toBe(true);
    expect(g10!.locked ?? false, r.id).toBe(false);
    for (const ly of INK_STAGE_LAYERS) expect(groups.some((g) => g.name.startsWith(ly)), `${r.id} ${ly}`).toBe(true);
    // LY-04 / LY-07 / LY-08: one panel-sized line image each, with the generation record in the pagination images.
    for (const g of [g04, g07, g08]) {
      const im = children(g!.id);
      expect(im.map((e) => e.type), `${r.id} ${g!.name}`).toEqual(['image']);
      expect(im[0]!.bounds).toEqual(byId.get(r.id)!.bounds);
      expect(im[0]!.src!.startsWith('data:image/png;base64,'), r.id).toBe(true);
      const src = content.pagination!.images.find((i) => i.elementId === im[0]!.id);
      expect(src?.source, r.id).toMatch(/Codex CLI \d+\.\d+\.\d+/);
      expect(src?.source, r.id).toContain(ROUGH_VERSION);
      expect(src?.source, r.id).toMatch(/sha256:[0-9a-f]{12}/);
      expect(src?.license).toContain('OpenAI');
    }
    // The figures and the background both have lines (the colour split worked).
    const p = ink.data.panels[r.id]!;
    // A panel without background lines (a close-up, or Gulliver's body as the ground) is listed with the reason.
    if (p.layers['LY-04'].share < BG_MIN_SHARE) noBg.push(r.id);
    if (stage.data.panels.find((x) => x.panel === r.id)!.figures.some((f) => rough.data.panels[r.id]!.figures.find((x) => x.fg === f.fg)!.inFrame))
      expect(p.layers['LY-07'].share, `${r.id} figure lines`).toBeGreaterThan(0.02);
    // LY-09: one movable group per balloon / narration box (outline and its words together), above the layers.
    const balloons = all.slice(layerNames.length);
    for (const g of balloons) {
      expect(g.type, r.id).toBe('group');
      expect(g.name.startsWith(BALLOON_LAYER), `${r.id} ${g.name}`).toBe(true);
      expect(g.locked ?? false).toBe(false);
      expect(children(g.id).filter((e) => e.type === 'text').length, `${r.id} ${g.name}`).toBe(1);
    }
    const words = [...balloons.flatMap((g) => children(g.id)), ...children(g10!.id)].filter((e) => e.type === 'text').map((e) => e.text);
    expect(r.lines.filter((l) => l.line.k !== 'T').every((l) => words.includes(l.line.text)), r.id).toBe(true);
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
  // Each panel's line art is its own (no reuse to explain).
  const srcs = els.filter((e) => e.type === 'image' && e.name.startsWith('人物の線画')).map((e) => e.src);
  expect(new Set(srcs).size).toBe(records.length);

  // ink.layers (sources): every page names the rough, the setting art and the generation record by fixed version.
  const pages = artifacts.find((a) => a.id === 'gm1-ep04-ink-pages')!.draft.content as { rows: { id: string; values: Record<string, unknown> }[] };
  expect(pages.rows.length).toBe(16);
  expect(pages.rows.flatMap((row) => String(row.values['ik.noBg'] ?? '').split('：')[0]!.split(' ').filter(Boolean))).toEqual(noBg);
  for (const row of pages.rows) {
    const v = row.values as Record<string, string>;
    expect(v['ik.rough'], row.id).toMatch(new RegExp(`${ROUGH_VERSION}：part1/rough/panels/.+ sha256:[0-9a-f]{12}`));
    expect(v['ik.art'], row.id).toMatch(/gulliver-manga@[0-9a-f]{8} part1\/codex\/.+ sha256:[0-9a-f]{12}|^無し：.+/);
    expect(v['ik.generated'], row.id).toMatch(/Codex CLI \d+\.\d+\.\d+/);
    expect(v['ik.generated'], row.id).toContain('OpenAI');
    for (const ly of ['LY-01', 'LY-02', 'LY-04', 'LY-07', 'LY-08']) expect(v['ik.layerNotes'], row.id).toContain(ly);
  }
  // A panel that draws Gulliver, a Lilliputian or the Emperor passed that character's setting art to Codex.
  const art: Record<string, string> = {
    'CH-01': 'ch01-gulliver-front',
    'CH-30': 'lilliputian-front',
    'CH-02': 'ch02-emperor',
    'CH-03': 'ch03-empress',
    'CH-04': 'ch04-flimnap',
    'CH-05': 'ch05-reldresal',
    'CH-06': 'ch06-bolgolam',
  };
  for (const sp of stage.data.panels) {
    const p = ink.data.panels[sp.panel]!;
    expect(p.refs[0]!.path, sp.panel).toBe(`part1/rough/panels/${sp.panel}.jpg`);
    for (const f of sp.figures.filter((f) => art[f.ch] && rough.data.panels[sp.panel]!.figures.find((x) => x.fg === f.fg)!.inFrame))
      expect(p.refs.some((r) => r.path.includes(art[f.ch]!)), `${sp.panel} ${f.fg}`).toBe(true);
    for (const ref of p.refs) expect(ref.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(p.rawSha256).toMatch(/^[0-9a-f]{64}$/);
  }

  // The draft captures as 16 vector pages with no error diagnostics; the export hides the memo groups.
  const design = artifacts.find((a) => a.id === 'gm1-ep04-ink')! as Artifact<DesignContent>;
  const exported = { ...design, draft: { ...design.draft, content: forExport(design.draft.content) } };
  const committed = await commitVersion({ ...exported, versions: [] } as never, null, '線画 第4話');
  const capture = await captureDesignPages(committed as never, (committed as Artifact<DesignContent>).versions[0].versionId, { mode: 'vector' });
  expect(capture.ok, JSON.stringify(capture.manifest.diagnostics)).toBe(true);
  expect(capture.pages.length).toBe(16);
  const svg = capture.pages.map((p) => p.svg).join('');
  for (const r of records) expect(svg.includes(`絵：${r.panel.art}`.slice(0, 20)), r.id).toBe(false);
  // The hidden rough is not in the exported pages.
  for (const id of Object.keys(rough.images).slice(0, 5)) expect(svg.includes(hidden('LY-02')[id]!.slice(40, 120)), id).toBe(false);

  const json = JSON.stringify(design);
  // The Playground imports at most 16 MB.
  expect(json.length, 'design artifact size').toBeLessThan(16 * 1024 * 1024);

  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    mkdirSync(`${out}/pages`, { recursive: true });
    for (const a of artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/ink-editor.json`, JSON.stringify({ artifacts }));
    capture.pages.forEach((p, i) => writeFileSync(`${out}/pages/page-${String(i + 1).padStart(2, '0')}.svg`, p.svg));
    writeFileSync(`${out}/pages/manifest.json`, JSON.stringify(capture.manifest, null, 1));
  }
}, 240_000);
