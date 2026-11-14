// Builds episode 1's 編集の記録 (fiction-manga@1.3.0 通読) and checks it: the fixed version is recorded
// (read.fixed-version) and every finding is tied to a page, panel, scene or script line that exists
// (read.traced). Run with vitest from apps/artifact-host/src/creative/story-board/ next to
// gulliver-part1-script.ts and gulliver-ep01-name.ts. GM_OUT writes the artifacts as JSON.
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { PART1_SCRIPT } from './gulliver-part1-script';
import { assignLines, pageId } from './gulliver-ep01-name';
import { buildGulliverEp01Read, FINDINGS, READ_COMMIT, READ_VERSIONS, VERDICT } from './gulliver-ep01-read';

test('episode 1 編集の記録 records the fixed version and ties every finding to its target', async () => {
  // read.fixed-version: the finished pages and the lettering record, by artifact and version, and the commit.
  expect(READ_VERSIONS.map((v) => v.artifact)).toEqual(expect.arrayContaining(['gm1-ep01-finish', 'gm1-ep01-lettering']));
  for (const v of READ_VERSIONS) expect(v.version, v.artifact).toMatch(/^[a-z0-9-]+-v\d+$/);
  expect(READ_COMMIT).toMatch(/^[0-9a-f]{40}$/);

  // read.traced: each target is a panel, a page, a scene or a script line of episode 1.
  const records = assignLines(1);
  const panels = new Set(records.map((r) => r.id));
  const pages = new Set(records.map((r) => pageId(1, r.page)));
  const ep = PART1_SCRIPT.find((e) => e.n === 1)!;
  const scenes = new Set(ep.scenes.map((s) => s.scene));
  const lines = new Set(ep.scenes.flatMap((s) => s.lines.map((_, i) => `${s.scene}.L${String(i + 1).padStart(2, '0')}`)));
  const ids = new Set<string>();
  for (const f of FINDINGS) {
    expect(ids.has(f.id), f.id).toBe(false);
    ids.add(f.id);
    expect(f.id).toMatch(/^RV-e01-\d{2}$/);
    const targets = f.target.split(' ');
    expect(targets.length, f.id).toBeGreaterThan(0);
    for (const t of targets) expect(panels.has(t) || pages.has(t) || scenes.has(t) || lines.has(t), `${f.id} ${t}`).toBe(true);
    expect(f.text.length, f.id).toBeGreaterThan(5);
    expect(f.reason.length, f.id).toBeGreaterThan(5);
    // A finding that was fixed names the version it was fixed in (and that version was read again).
    if (f.decision === '直す') expect(f.fixedIn, f.id).toBeTruthy();
    // The AI does not decide: an AI finding is fixed or left only by the author's decision (its reason says so);
    // otherwise it waits for the author or only records an intent.
    if (f.by === 'AI' && (f.decision === '直す' || f.decision === '直さない')) expect(f.reason, f.id).toMatch(/^作者の判断/);
    // The fixed version is the one this record reads.
    if (f.fixedIn && f.by === 'AI') expect(f.fixedIn, f.id).toContain(READ_VERSIONS[0].version);
  }
  expect(VERDICT.status.length).toBeGreaterThan(0);

  const artifacts = await buildGulliverEp01Read();
  expect(artifacts.map((a) => a.id)).toEqual(['gm1-ep01-read', 'gm1-ep01-read-findings']);
  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    for (const a of artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/read-editor.json`, JSON.stringify({ artifacts }));
  }
});
