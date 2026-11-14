// Builds the part 1 script (Document + lines table), checks it against the story artifacts
// (composition order, character sheet) and writes it as JSON (GM_OUT). Run with vitest from
// apps/artifact-host/src/creative/story-board/ next to gulliver-part1.ts and gulliver-story.ts.
import { writeFileSync, mkdirSync } from 'node:fs';
import { test, expect } from 'vitest';
import type { StructuredData } from '@editor-platform/structured-data/model';
import { buildGulliverStory, EPISODES } from './gulliver-story';
import { buildGulliverPart1Script, PART1_SCRIPT, SPEAKER_NAMES } from './gulliver-part1-script';

test('gulliver part 1 script follows the composition and every line cites a speaker', async () => {
  const story = await buildGulliverStory();
  const characters = story.artifacts.find((a) => a.id === 'gms-characters')!.draft.content as StructuredData;
  const composition = story.artifacts.find((a) => a.id === 'gms-composition')!.draft.content as StructuredData;
  const known = new Set(characters.rows.map((r) => r.id));

  expect(PART1_SCRIPT.map((e) => e.n)).toEqual([1, 2, 3, 4, 5, 6]);
  const notInCast: string[] = [];
  for (const ep of PART1_SCRIPT) {
    // The scenes are the composition's scenes for this episode, in the same order.
    const placed = composition.rows
      .filter((r) => r.values['tl1.part'] === `第${ep.n}話`)
      .sort((a, b) => (a.values['tl1.order'] as number) - (b.values['tl1.order'] as number))
      .map((r) => r.values['tl1.ref.item']);
    expect(ep.scenes.map((s) => s.scene), `第${ep.n}話`).toEqual(placed);
    // 16 pages per episode.
    expect(ep.scenes.reduce((n, s) => n + s.pages, 0), `第${ep.n}話`).toBe(16);
    // AR-05: the first scene of each episode opens with a wide shot showing both sizes.
    expect(ep.scenes[0].lines[0].k).toBe('T');
    expect(ep.scenes[0].lines[0].text).toMatch(/1ページ目、引きのコマ/);
    // ... and that shot names both size groups: Gulliver and the little people.
    expect(ep.scenes[0].lines[0].text, `第${ep.n}話`).toMatch(/ガリヴァー/);
    expect(ep.scenes[0].lines[0].text, `第${ep.n}話`).toMatch(/小人/);
    for (const s of ep.scenes) {
      expect(s.lines.length, s.scene).toBeGreaterThan(0);
      for (const l of s.lines) {
        expect(l.text.trim(), s.scene).not.toBe('');
        if (l.k === 'D' || l.k === 'N') {
          // Every spoken line and narration cites a person in the character sheet.
          expect(known.has(l.who!), `${s.scene} ${l.who}`).toBe(true);
          expect(SPEAKER_NAMES[l.who!], `${s.scene} ${l.who}`).toBeTruthy();
        }
        if (l.k === 'N') expect(l.who).toBe('CH-01');
        if (l.k === 'T' || l.k === 'S') expect(l.who).toBeUndefined();
      }
      // Every person cited by the scene card who speaks in the scene is in the cast.
      const cast = new Set(EPISODES.find((e) => e.n === ep.n)!.scenes.find((x) => x.id === s.scene)!.cast);
      for (const l of s.lines)
        if (l.k === 'D' && !['CH-30', 'CH-31'].includes(l.who!) && !cast.has(l.who!)) notInCast.push(`${s.scene} ${l.who}`);
    }
  }
  expect([...new Set(notInCast)]).toEqual([]);

  const artifacts = await buildGulliverPart1Script();
  const lines = artifacts.find((a) => a.id === 'gm1-script-lines')!.draft.content as StructuredData;
  expect(lines.rows.length).toBe(PART1_SCRIPT.flatMap((e) => e.scenes.flatMap((s) => s.lines)).length);
  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    for (const a of artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/script-editor.json`, JSON.stringify({ artifacts }));
  }
});
