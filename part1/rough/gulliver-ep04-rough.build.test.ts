// Builds episode 4's rough (a manga-workspace Design draft with the rough layers + two tables), checks it
// against fiction-manga@1.3.0 ラフ (rough.layers, rough.lettering-clear, rough.sources, rough.figures-drawn) and the
// episode 1 learnings carried into the prompts, captures the pages as SVG and writes everything as JSON (GM_OUT).
// Run with vitest from apps/artifact-host/src/creative/story-board/ next to gulliver-ep01-name.ts,
// gulliver-ep04-name.ts, gulliver-ep01-rough.ts, gulliver-part1-script.ts, the stage (gulliver-ep04-stage/) and the
// rough assets (gulliver-ep04-rough/).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { test, expect } from 'vitest';
import { captureDesignPages } from '@editor-platform/design/pagination';
import { commitVersion, type Artifact } from '@editor-platform/artifact-core';
import type { DesignContent, DesignElement } from '@editor-platform/design/model';
import { BALLOON_LAYER, LAYERS, type EpisodeStage, type StageInput } from './gulliver-ep01-name';
import { EP04_NAME } from './gulliver-ep04-name';
import { forExport, ROUGH_LAYERS, ROUGH_UNDERLAY_OPACITY, type EpisodeRough, type RoughInput } from './gulliver-ep01-rough';
import { buildGulliverEp04Rough, NAME_VERSION_EP04 as NAME_VERSION } from './gulliver-ep04-rough';

const here = (p: string) => new URL(p, import.meta.url).pathname;
const STAGE = process.env.GM_STAGE ?? here('./gulliver-ep04-stage/');
const ROUGH = process.env.GM_ROUGH ?? here('./gulliver-ep04-rough/');
const jpeg = (path: string) => `data:image/jpeg;base64,${readFileSync(path).toString('base64')}`;
function loadStage(): StageInput {
  const data = JSON.parse(readFileSync(`${STAGE}/ep04-stage.json`, 'utf8')) as EpisodeStage;
  return { data, images: Object.fromEntries(data.panels.filter((p) => p.underlay).map((p) => [p.panel, jpeg(`${STAGE}/${p.underlay}`)])) };
}
function loadRough(): RoughInput {
  const data = JSON.parse(readFileSync(`${ROUGH}/ep04-rough.json`, 'utf8')) as EpisodeRough;
  return { data, images: Object.fromEntries(Object.entries(data.panels).map(([id, p]) => [id, jpeg(`${ROUGH}/${p.image}`)])) };
}

test('episode 4 rough has the rough layers, its sources and a drawing for every figure', async () => {
  const stage = loadStage();
  const rough = loadRough();
  const { build, artifacts } = await buildGulliverEp04Rough(stage, rough);
  const { content, records } = build;
  const els = content.elements;
  const byId = new Map(els.map((e) => [e.id, e]));
  const children = (id: string) => els.filter((e) => e.parentId === id);

  // Same pages and panels as the ネーム (PN ids kept).
  expect(new Set(records.map((r) => r.page)).size).toBe(EP04_NAME.length);
  expect(records.map((r) => r.id)).toEqual(stage.data.panels.map((p) => p.panel));

  const layerNames = Object.values(LAYERS);
  const covered: string[] = [];
  for (const r of records) {
    // rough.layers: every panel has the rough-stage layers of the art guide, in stacking order, and nothing else
    // directly in the panel.
    const all = children(r.id);
    const groups = all.slice(0, layerNames.length);
    expect(groups.map((g) => g.name), r.id).toEqual(layerNames);
    const [g01, g02, g10, gMemo] = groups as DesignElement[];
    // The image layers and the memo are locked so that dragging a balloon never moves the drawing.
    expect([g01, g02, gMemo].every((g) => g!.locked), r.id).toBe(true);
    expect(g10!.locked ?? false, r.id).toBe(false);
    // LY-09: one movable group per balloon / narration box (outline and its words together), above the layers.
    const balloons = all.slice(layerNames.length);
    for (const g of balloons) {
      expect(g.type, r.id).toBe('group');
      expect(g.name.startsWith(BALLOON_LAYER), `${r.id} ${g.name}`).toBe(true);
      expect(children(g.id).filter((e) => e.type === 'text').length, `${r.id} ${g.name}`).toBe(1);
    }
    const lyIds = [...groups.map((g) => g.name.slice(0, 5)), ...(balloons.length ? [BALLOON_LAYER] : [])];
    for (const ly of ROUGH_LAYERS) expect(lyIds.includes(ly) || (ly === BALLOON_LAYER && !r.lines.some((l) => l.line.k === 'D' || l.line.k === 'N')), `${r.id} ${ly}`).toBe(true);
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
    // LY-10 holds the sound effects and the title.
    expect(children(g10!.id).every((e) => e.type === 'text'), r.id).toBe(true);
    const words = [...balloons.flatMap((g) => children(g.id)), ...children(g10!.id)].filter((e) => e.type === 'text').map((e) => e.text);
    const lettered = r.lines.filter((l) => l.line.k !== 'T').map((l) => l.line.text);
    expect(lettered.every((t) => words.includes(t)), r.id).toBe(true);
    // rough.lettering-clear: no balloon, narration box or sound effect covers the head of a figure in frame.
    const b = byId.get(r.id)!.bounds;
    const occ = rough.data.panels[r.id]!.occupancy;
    const boxes = [...balloons, ...children(g10!.id)].map((e) => e.bounds);
    for (const h of occ.heads) {
      const hx = b.x + h.x * b.width,
        hy = b.y + h.y * b.height;
      for (const x of boxes) if (hx >= x.x && hx <= x.x + x.width && hy >= x.y && hy <= x.y + x.height) covered.push(`${r.id} ${h.fg}`);
    }
  }
  expect(covered).toEqual([]);
  // Each rough drawing is used in one panel only (no reuse to explain).
  const srcs = els.filter((e) => e.type === 'image' && e.name.startsWith('ラフ絵')).map((e) => e.src);
  expect(new Set(srcs).size).toBe(records.length);

  // rough.sources: every page names the setting art and samples by fixed version, and the generation record.
  const pages = artifacts.find((a) => a.id === 'gm1-ep04-rough-pages')!.draft.content as { rows: { id: string; values: Record<string, unknown> }[] };
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
  const art: Record<string, string> = {
    'CH-01': 'ch01-gulliver-front',
    'CH-30': 'lilliputian-front',
    'CH-02': 'ch02-emperor',
    'CH-03': 'ch03-empress',
    'CH-04': 'ch04-flimnap',
    'CH-05': 'ch05-reldresal',
    'CH-06': 'ch06-bolgolam',
    'CH-31': 'lilliputian-front',
  };
  for (const sp of stage.data.panels) {
    const p = rough.data.panels[sp.panel]!;
    for (const f of sp.figures.filter((f) => art[f.ch] && p.figures.find((x) => x.fg === f.fg)!.inFrame))
      expect(p.refs.some((r) => r.path.includes(art[f.ch]!)), `${sp.panel} ${f.fg}`).toBe(true);
  }
  for (const p of Object.values(rough.data.panels)) {
    for (const ref of p.refs) expect(ref.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(p.rawSha256).toMatch(/^[0-9a-f]{64}$/);
  }

  // A panel drawn again before the author saw it keeps why and the first raw output.
  for (const [id, p] of Object.entries(rough.data.panels) as [string, EpisodeRough['panels'][string] & { retake?: { reason: string; firstRawSha256: string } }][])
    if (p.retake) {
      expect(p.retake.reason, id).not.toBe('');
      expect(p.retake.firstRawSha256, id).toMatch(/^[0-9a-f]{64}$/);
    }

  // Episode 1-3 learnings in every prompt: the carried-over state wherever Gulliver is drawn (LN-e01-04: the coat,
  // then the leather jerkin and bare feet, the spectacles), a background (LN-e01-03), no cut or partial faces (LN-e02-02),
  // a size comparison wherever Gulliver meets the Lilliputians (LN-e01-02), the flashback note in the flashback sets,
  // headroom above Gulliver in the wide shots (LN-e02-05) and thin things kept thin (LN-e02-04).
  const shotOf = new Map(records.map((r) => [r.id, r.panel]));
  for (const sp of stage.data.panels) {
    const prompt = readFileSync(`${ROUGH}/${rough.data.panels[sp.panel]!.prompt}`, 'utf8');
    const gul = sp.figures.some((f) => f.ch === 'CH-01');
    if (gul) expect(prompt, sp.panel).toContain('Continuity:');
    expect(prompt, sp.panel).toContain('Always draw a background');
    expect(prompt, sp.panel).toContain('never show only part of a face');
    if (['past', 'eggs'].includes(sp.set)) expect(prompt, sp.panel).toContain('FLASHBACK');
    else if (gul) expect(prompt, sp.panel).toContain('Size check inside the picture');
    const name = shotOf.get(sp.panel)!;
    if (gul && ['引き', '大引き'].includes(name.shot)) expect(prompt, sp.panel).toContain('LN-e02-05');
    if (/(綱|矢|鉤)/.test(name.art)) expect(prompt, sp.panel).toContain('LN-e02-04');
    // LN-e03-05: from 10-2 on Gulliver has no coat; the waistcoat is worded the same in the figure line and the continuity.
    if (sp.figures.some((f) => (f as { fig?: string }).fig === 'gw')) {
      expect(prompt, sp.panel).toContain('a white shirt with a buttoned pale-brown sleeveless waistcoat');
      expect(prompt, sp.panel).toContain('(NO coat)');
      expect(prompt, sp.panel).not.toContain('blue coat');
    }
    // Night and morning light (pages 10-16).
    if (Number(sp.panel.slice(5, 7)) >= 10) expect(prompt, sp.panel).toMatch(/Time: (MIDNIGHT|NIGHT|early MORNING)/);
    // LN-e03-01: a wide low strip keeps the faces in the middle band; LN-e03-02 extras' age and height.
    const aspect = Math.tan((sp.hfovDeg * Math.PI) / 360) / Math.tan((sp.vfovDeg * Math.PI) / 360);
    if (aspect > 2.2) expect(prompt, sp.panel).toContain('LN-e03-01');
    expect(prompt, sp.panel).toContain('LN-e03-02');
    // A face the ネーム says is not drawn stays out of the rough's prompt too.
    if (name.art.includes('描かない')) expect(prompt, sp.panel).toContain('draw no part of that face');
  }

  // rough.figures-drawn: every FG of the stage has a row; drawn ones point at their panel's rough, the rest say why.
  const figs = artifacts.find((a) => a.id === 'gm1-ep04-rough-figures')!.draft.content as { rows: { id: string; values: Record<string, unknown> }[] };
  const fgs = stage.data.panels.flatMap((p) => p.figures.map((f) => f.fg));
  expect(figs.rows.map((r) => r.id)).toEqual(fgs);
  for (const row of figs.rows) {
    const v = row.values;
    if (v['rf.drawn']) expect(v['rf.drawing'], row.id).toContain(`ラフ絵 ${v['rf.panel']}`);
    else expect(String(v['rf.note']), row.id).toMatch(/画角の外/);
  }
  // Every panel with figures draws at least one of them, except where the ネーム says Gulliver is not drawn (14-1: the
  // crowd's faces and the steam stand for him).
  for (const p of stage.data.panels.filter((p) => p.figures.length && !shotOf.get(p.panel)!.art.includes('ガリヴァーは描かない')))
    expect(figs.rows.some((r) => r.values['rf.panel'] === p.panel && r.values['rf.drawn']), p.panel).toBe(true);

  // The draft captures as 16 vector pages with no error diagnostics.
  const design = artifacts.find((a) => a.id === 'gm1-ep04-rough')! as Artifact<DesignContent>;
  // The export hides the memo groups (the ネーム tags and art memos); the editable draft keeps them.
  const exported = { ...design, draft: { ...design.draft, content: forExport(design.draft.content) } };
  expect(design.draft.content.elements.filter((e) => e.name === LAYERS.memo && !e.hidden).length).toBe(records.length);
  const committed = await commitVersion({ ...exported, versions: [] } as never, null, 'ラフ 第4話');
  const capture = await captureDesignPages(committed as never, (committed as Artifact<DesignContent>).versions[0].versionId, { mode: 'vector' });
  expect(capture.ok, JSON.stringify(capture.manifest.diagnostics)).toBe(true);
  expect(capture.pages.length).toBe(16);
  const memos = els.filter((e) => e.type === 'text' && byId.get(e.parentId!)?.name === LAYERS.memo).map((e) => e.text!);
  expect(memos.length).toBe(records.length * 2);
  const svg = capture.pages.map((p) => p.svg).join('');
  for (const r of records) expect(svg.includes(`絵：${r.panel.art}`.slice(0, 20)), r.id).toBe(false);

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
