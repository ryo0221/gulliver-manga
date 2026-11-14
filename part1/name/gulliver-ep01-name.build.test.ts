// Builds episode 1's ネーム (a manga-workspace Design draft + a panel table), checks it against the
// script and the art guide (AR-05), captures the pages as SVG, and writes everything as JSON (GM_OUT).
// Run with vitest from apps/artifact-host/src/creative/story-board/ next to gulliver-part1.ts,
// gulliver-story.ts and gulliver-part1-script.ts.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { test, expect } from 'vitest';
import { commitVersion, type Artifact } from '@editor-platform/artifact-core';
import { layoutDrawingText } from '@editor-platform/editor-core';
import { captureDesignPages } from '@editor-platform/design/pagination';
import type { DesignContent } from '@editor-platform/design/model';
import { PART1_SCRIPT } from './gulliver-part1-script';
import {
  buildGulliverEp01Name,
  EP01_NAME,
  corners,
  insidePolygon,
  LILLIPUT_EYE,
  panelPolygon,
  UNDERLAY_OPACITY,
  type EpisodeStage,
  type StageInput,
} from './gulliver-ep01-name';

// The 3D staging (part1/name/stage/ in gulliver-manga), copied next to this file.
const STAGE = process.env.GM_STAGE ?? new URL('./gulliver-ep01-stage/', import.meta.url).pathname;
function loadStage(): StageInput {
  const data = JSON.parse(readFileSync(`${STAGE}/ep01-stage.json`, 'utf8')) as EpisodeStage;
  const images: Record<string, string> = {};
  for (const p of data.panels)
    if (p.underlay) images[p.panel] = `data:image/jpeg;base64,${readFileSync(`${STAGE}/${p.underlay}`).toString('base64')}`;
  return { data, images };
}

test('episode 1 ネーム covers every script line, reads left to right and fits its text', async () => {
  const stage = loadStage();
  const { build, artifacts } = await buildGulliverEp01Name(stage);
  const { content, records, placed } = build;
  const script = PART1_SCRIPT.find((e) => e.n === 1)!;

  // 16 pages; each scene keeps the page count the script gave it.
  expect(EP01_NAME.length).toBe(16);
  for (const s of script.scenes)
    expect(EP01_NAME.filter((p) => p.scene === s.scene).length, s.scene).toBe(s.pages);
  // Pages follow the script's scene order.
  const order = [...new Set(EP01_NAME.map((p) => p.scene))];
  expect(order).toEqual(script.scenes.map((s) => s.scene));

  // Every script line is in exactly one panel, in script order (シーンの網羅).
  const all = script.scenes.flatMap((s) => s.lines.map((_, i) => `${s.scene}.L${String(i + 1).padStart(2, '0')}`));
  expect(records.flatMap((r) => r.lines.map((l) => l.id))).toEqual(all);
  // Every line that is lettered (narration, dialogue, sound) is placed once on the page.
  const lettered = records.flatMap((r) => r.lines.filter((l) => l.line.k !== 'T').map((l) => l.id));
  expect(placed.filter((p) => p.lineId).map((p) => p.lineId)).toEqual(lettered);
  for (const r of records)
    for (const l of r.lines.filter((l) => l.line.k !== 'T'))
      expect(
        content.elements.some((e) => e.parentId !== undefined && e.type === 'text' && e.text === l.line.text),
        l.id,
      ).toBe(true);

  // Reading direction: left to right; panels in each page read top tier first, left to right.
  expect(content.pagination!.direction).toBe('ltr');
  expect(content.pagination!.pages.length).toBe(16);
  const index = new Map(content.elements.map((e) => [e.id, e]));
  for (const page of content.pagination!.pages) {
    const panels = page.panelIds.map((id) => index.get(id)!);
    expect(panels.length).toBeGreaterThan(0);
    for (let i = 1; i < panels.length; i++) {
      const a = panels[i - 1].bounds,
        b = panels[i].bounds;
      const sameTier = Math.abs(a.y - b.y) < 40;
      if (sameTier) expect(b.x, page.frameId).toBeGreaterThan(a.x);
      else expect(b.y, page.frameId).toBeGreaterThan(a.y);
    }
    // A page holds at most 6 panels (readability on a phone).
    expect(panels.length, page.frameId).toBeLessThanOrEqual(6);
  }

  // AR-05: the first page has the wide shot with both sizes; every panel that shows the size
  // difference is shot from the little people's eye height.
  const first = records.filter((r) => r.page === 1)[0];
  expect(first.panel.size).toBe(true);
  expect(first.panel.shot).toBe('大引き');
  for (const r of records.filter((r) => r.panel.size)) expect(r.panel.cam.eye, r.id).toBe('L');
  // Heights are measured from the ground: a camera on a raised surface (Gulliver's chest, the
  // turret, the city wall, a lookout or scaffold) adds the surface height to the eye height.
  for (const r of records) {
    const c = r.panel.cam;
    if (c.eye === 'L' && /^(胸の上|塔の上|都の城壁の上|柱の上|鍛冶の足場)/.test(c.look)) {
      expect(c.stand, `${r.id} ${c.look}`).toBeDefined();
      expect(c.mm, r.id).toBe(c.stand!.mm + LILLIPUT_EYE);
    }
    if (c.stand) expect(c.mm, r.id).toBeGreaterThan(c.stand.mm);
  }
  // Continuity: only Gulliver's left arm is free in SC-004 (the script tears the left cords).
  for (const r of records.filter((r) => r.scene === 'SC-004'))
    expect(`${r.panel.cam.look}${r.panel.art}`, r.id).not.toMatch(/右手|右腕/);

  // Every text box sits inside its panel's polygon, clear of the border, and nothing overflows.
  expect(build.overflow).toEqual([]);
  for (const p of placed) {
    const panel = index.get(p.panelId)!;
    expect(insidePolygon(corners(p.outline), panelPolygon(panel), 6), `${p.panelId} ${p.kind} ${p.lineId ?? ''}`).toBe(true);
  }
  // Every text element's own layout (the one SVG and canvas draw) fits its box: no clipped lines.
  for (const e of content.elements.filter((e) => e.type === 'text')) {
    const layout = layoutDrawingText({ ...e, kind: 'text' } as never);
    expect(layout.totalHeight, `${e.name}: ${e.text}`).toBeLessThanOrEqual(e.bounds.height + 0.5);
  }
  // Lettered items in a panel do not overlap each other.
  for (const r of records) {
    const boxes = placed.filter((p) => p.panelId === r.id && p.kind !== 'tag' && p.kind !== 'memo');
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].outline,
          b = boxes[j].outline;
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        expect(overlap, `${r.id} ${boxes[i].lineId} ${boxes[j].lineId}`).toBe(false);
      }
  }

  // fiction-manga@1.2.0 storyboard.staged: every panel is staged on the 3D digital twin.
  const byPanel = new Map(stage.data.panels.map((p) => [p.panel, p]));
  expect([...byPanel.keys()].sort()).toEqual(records.map((r) => r.id).sort());
  for (const r of records) {
    const sp = byPanel.get(r.id)!;
    const set = stage.data.sets[sp.set]!;
    // The set belongs to the panel's scene and names the model versions it was staged on.
    expect(set.scenes, r.id).toContain(r.scene);
    expect(set.props.length, r.id).toBeGreaterThan(0);
    for (const m of set.props) expect(m.versionId && m.contentHash, `${r.id} ${m.name}`).toBeTruthy();
    // The camera stands where the panel table says: its height is the table's eye height.
    expect(Math.abs(sp.cam[2] - r.panel.cam.mm), `${r.id} camera height`).toBeLessThanOrEqual(1);
    if (r.panel.cam.stand) expect(sp.stand, `${r.id} stand`).toBeTruthy();
    expect(existsSync(`${STAGE}/${sp.plan}`), `${r.id} plan`).toBe(true);
    // Every figure has an FG id and a character from the cast list.
    for (const f of sp.figures) {
      expect(f.fg, r.id).toMatch(new RegExp(`^FG-${r.id}-\\d{2}$`));
      expect(f.ch, `${r.id} ${f.fg}`).toMatch(/^(CH-\d{2}|horse)$/);
    }
    const under = content.elements.filter((e) => e.parentId === r.id && e.type === 'image');
    if (sp.noModel) {
      // No model for the place: the reason is written, and nothing is laid under the panel.
      expect(sp.noModel.length, r.id).toBeGreaterThan(5);
      expect(under, r.id).toEqual([]);
    } else {
      // The camera's view, cropped to the panel's shape, lies under everything else in the panel.
      expect(under.length, r.id).toBe(1);
      const u = under[0]!;
      expect(u.bounds, r.id).toEqual(index.get(r.id)!.bounds);
      expect(u.opacity, r.id).toBe(UNDERLAY_OPACITY);
      const children = content.elements.filter((e) => e.parentId === r.id);
      expect(children[0]!.id, r.id).toBe(u.id);
      expect(content.pagination!.images.some((i) => i.elementId === u.id), r.id).toBe(true);
      // The crop keeps the panel's aspect: its field of view is no wider than the camera's.
      expect(sp.vfovDeg, r.id).toBeLessThanOrEqual(stage.data.verticalFovDeg + 0.05);
    }
  }
  // The size-difference panels are all staged with a model (AR-05 needs the real sizes).
  for (const r of records.filter((r) => r.panel.size)) expect(byPanel.get(r.id)!.noModel ?? null, r.id).toBeNull();

  // The draft captures as 16 vector pages with no error diagnostics.
  const design = artifacts.find((a) => a.id === 'gm1-ep01-name')! as Artifact<DesignContent>;
  const committed = await commitVersion({ ...design, versions: [] } as never, null, 'ネーム 第1話');
  const capture = await captureDesignPages(committed as never, (committed as Artifact<DesignContent>).versions[0].versionId, { mode: 'vector' });
  expect(capture.ok, JSON.stringify(capture.manifest.diagnostics)).toBe(true);
  expect(capture.pages.length).toBe(16);

  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    mkdirSync(`${out}/pages`, { recursive: true });
    for (const a of artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/name-editor.json`, JSON.stringify({ artifacts }));
    capture.pages.forEach((p, i) => writeFileSync(`${out}/pages/page-${String(i + 1).padStart(2, '0')}.svg`, p.svg));
    writeFileSync(`${out}/pages/manifest.json`, JSON.stringify(capture.manifest, null, 1));
  }
});
