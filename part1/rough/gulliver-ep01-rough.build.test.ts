// Builds episode 1's rough (a manga-workspace Design draft with the rough layers + two tables), checks it
// against fiction-manga@1.2.0 ラフ (rough.layers, rough.sources, rough.figures-drawn), captures the pages as SVG
// and writes everything as JSON (GM_OUT). Run with vitest from apps/artifact-host/src/creative/story-board/
// next to gulliver-ep01-name.ts, gulliver-part1-script.ts, the stage (gulliver-ep01-stage/) and the rough
// assets (gulliver-ep01-rough/).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { test, expect } from 'vitest';
import { captureDesignPages } from '@editor-platform/design/pagination';
import { commitVersion, type Artifact } from '@editor-platform/artifact-core';
import type { DesignContent, DesignElement } from '@editor-platform/design/model';
import { EP01_NAME, LAYERS, type EpisodeStage, type StageInput } from './gulliver-ep01-name';
import {
  buildGulliverEp01Rough,
  NAME_VERSION,
  ROUGH_LAYERS,
  ROUGH_UNDERLAY_OPACITY,
  type EpisodeRough,
  type RoughInput,
} from './gulliver-ep01-rough';

const here = (p: string) => new URL(p, import.meta.url).pathname;
const STAGE = process.env.GM_STAGE ?? here('./gulliver-ep01-stage/');
const ROUGH = process.env.GM_ROUGH ?? here('./gulliver-ep01-rough/');
const jpeg = (path: string) => `data:image/jpeg;base64,${readFileSync(path).toString('base64')}`;
function loadStage(): StageInput {
  const data = JSON.parse(readFileSync(`${STAGE}/ep01-stage.json`, 'utf8')) as EpisodeStage;
  return { data, images: Object.fromEntries(data.panels.filter((p) => p.underlay).map((p) => [p.panel, jpeg(`${STAGE}/${p.underlay}`)])) };
}
function loadRough(): RoughInput {
  const data = JSON.parse(readFileSync(`${ROUGH}/ep01-rough.json`, 'utf8')) as EpisodeRough;
  return { data, images: Object.fromEntries(Object.entries(data.panels).map(([id, p]) => [id, jpeg(`${ROUGH}/${p.image}`)])) };
}

test('episode 1 rough has the rough layers, its sources and a drawing for every figure', async () => {
  const stage = loadStage();
  const rough = loadRough();
  const { build, artifacts } = await buildGulliverEp01Rough(stage, rough);
  const { content, records } = build;
  const els = content.elements;
  const byId = new Map(els.map((e) => [e.id, e]));
  const children = (id: string) => els.filter((e) => e.parentId === id);

  // Same pages and panels as the ネーム (PN ids kept).
  expect(new Set(records.map((r) => r.page)).size).toBe(EP01_NAME.length);
  expect(records.map((r) => r.id)).toEqual(stage.data.panels.map((p) => p.panel));

  const layerNames = Object.values(LAYERS);
  for (const r of records) {
    // rough.layers: every panel has the rough-stage layers of the art guide, in stacking order, and nothing else
    // directly in the panel.
    const groups = children(r.id);
    expect(groups.map((g) => g.name), r.id).toEqual(layerNames);
    for (const ly of ROUGH_LAYERS) expect(groups.some((g) => g.name.startsWith(ly)), `${r.id} ${ly}`).toBe(true);
    const [g01, g02, g09, g10] = groups as DesignElement[];
    // LY-01: the 3D camera picture, panel-sized, faint.
    const ul = children(g01!.id);
    expect(ul.length, r.id).toBe(1);
    expect(ul[0]!.type).toBe('image');
    expect(ul[0]!.bounds).toEqual(byId.get(r.id)!.bounds);
    expect(ul[0]!.opacity).toBe(ROUGH_UNDERLAY_OPACITY);
    // LY-02: the panel's own rough drawing, panel-sized, with its source in the pagination images.
    const rd = children(g02!.id);
    expect(rd.map((e) => e.type), r.id).toEqual(['image']);
    expect(rd[0]!.bounds).toEqual(byId.get(r.id)!.bounds);
    const src = content.pagination!.images.find((i) => i.elementId === rd[0]!.id);
    expect(src?.source, r.id).toContain(NAME_VERSION);
    expect(src?.license).toContain('OpenAI');
    // LY-09 holds only balloon outlines and narration boxes; LY-10 only text.
    const under = (id: string): DesignElement[] => children(id).flatMap((e) => [e, ...under(e.id)]);
    expect(under(g09!.id).every((e) => e.type !== 'text' && e.type !== 'image'), r.id).toBe(true);
    expect(children(g10!.id).every((e) => e.type === 'text'), r.id).toBe(true);
    const lettered = r.lines.filter((l) => l.line.k !== 'T').map((l) => l.line.text);
    expect(children(g10!.id).map((e) => e.text).filter((t) => lettered.includes(t!)).length, r.id).toBe(lettered.length);
  }
  // Each rough drawing is used in one panel only (no reuse to explain).
  const srcs = els.filter((e) => e.type === 'image' && e.name.startsWith('ラフ絵')).map((e) => e.src);
  expect(new Set(srcs).size).toBe(records.length);

  // rough.sources: every page names the setting art and samples by fixed version, and the generation record.
  const pages = artifacts.find((a) => a.id === 'gm1-ep01-rough-pages')!.draft.content as { rows: { id: string; values: Record<string, unknown> }[] };
  expect(pages.rows.length).toBe(16);
  for (const row of pages.rows) {
    const v = row.values as Record<string, string>;
    expect(v['rf.art'], row.id).toMatch(/gulliver-manga@[0-9a-f]{8} part1\/codex\/.+ sha256:[0-9a-f]{12}|^無し：.+/);
    expect(v['rf.samples'], row.id).toMatch(/SM-0\d/);
    expect(v['rf.samples'], row.id).toMatch(/@[\w-]+/);
    expect(v['rf.generated'], row.id).toMatch(/Codex CLI \d+\.\d+\.\d+/);
    expect(v['rf.generated'], row.id).toContain(NAME_VERSION);
    expect(v['rf.generated'], row.id).toContain('OpenAI');
    expect(v['rf.layerNotes'], row.id).toContain('LY-02');
  }
  // A panel that draws Gulliver, a Lilliputian or the Emperor passed that character's setting art to Codex.
  const art: Record<string, string> = { 'CH-01': 'ch01-gulliver-front', 'CH-30': 'lilliputian-front', 'CH-02': 'ch02-emperor' };
  for (const sp of stage.data.panels) {
    const p = rough.data.panels[sp.panel]!;
    for (const f of sp.figures.filter((f) => art[f.ch] && p.figures.find((x) => x.fg === f.fg)!.inFrame))
      expect(p.refs.some((r) => r.path.includes(art[f.ch]!)), `${sp.panel} ${f.fg}`).toBe(true);
  }
  for (const p of Object.values(rough.data.panels)) {
    for (const ref of p.refs) expect(ref.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(p.rawSha256).toMatch(/^[0-9a-f]{64}$/);
  }

  // rough.figures-drawn: every FG of the stage has a row; drawn ones point at their panel's rough, the rest say why.
  const figs = artifacts.find((a) => a.id === 'gm1-ep01-rough-figures')!.draft.content as { rows: { id: string; values: Record<string, unknown> }[] };
  const fgs = stage.data.panels.flatMap((p) => p.figures.map((f) => f.fg));
  expect(figs.rows.map((r) => r.id)).toEqual(fgs);
  for (const row of figs.rows) {
    const v = row.values;
    if (v['rf.drawn']) expect(v['rf.drawing'], row.id).toContain(`ラフ絵 ${v['rf.panel']}`);
    else expect(String(v['rf.note']), row.id).toMatch(/画角の外/);
  }
  // Every panel with figures draws at least one of them.
  for (const p of stage.data.panels.filter((p) => p.figures.length))
    expect(figs.rows.some((r) => r.values['rf.panel'] === p.panel && r.values['rf.drawn']), p.panel).toBe(true);

  // The draft captures as 16 vector pages with no error diagnostics.
  const design = artifacts.find((a) => a.id === 'gm1-ep01-rough')! as Artifact<DesignContent>;
  const committed = await commitVersion({ ...design, versions: [] } as never, null, 'ラフ 第1話');
  const capture = await captureDesignPages(committed as never, (committed as Artifact<DesignContent>).versions[0].versionId, { mode: 'vector' });
  expect(capture.ok, JSON.stringify(capture.manifest.diagnostics)).toBe(true);
  expect(capture.pages.length).toBe(16);

  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    mkdirSync(`${out}/pages`, { recursive: true });
    for (const a of artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/rough-editor.json`, JSON.stringify({ artifacts }));
    capture.pages.forEach((p, i) => writeFileSync(`${out}/pages/page-${String(i + 1).padStart(2, '0')}.svg`, p.svg));
    writeFileSync(`${out}/pages/manifest.json`, JSON.stringify(capture.manifest, null, 1));
  }
}, 120_000);
