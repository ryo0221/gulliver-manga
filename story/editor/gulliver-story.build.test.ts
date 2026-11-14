// Builds the whole-story (24 episodes) native artifacts, opens them with the Story Timeline
// projection and checks them, then writes them as JSON (GM_OUT). Run with vitest from
// apps/artifact-host/src/creative/story-board/ next to gulliver-part1.ts.
import { writeFileSync, mkdirSync } from 'node:fs';
import { test, expect } from 'vitest';
import { MemoryStorage, type Artifact } from '@editor-platform/artifact-core';
import { TimelineWorkbench } from '../timeline/workbench';
import { resolveTimelineProjection } from '../timeline/projection';
import { buildGulliverStory, EPISODES, PLOTS, LATER_EVENTS, REPRISE } from './gulliver-story';
import { PART1_EVENTS } from './gulliver-part1';

test('gulliver story (24 episodes) opens in the Story Timeline and every event is presented', async () => {
  const story = await buildGulliverStory();
  const storage = new MemoryStorage<Artifact<unknown>>();
  for (const a of story.artifacts) await storage.put(a);
  const mayRead = () => true;
  const w = await TimelineWorkbench.open(storage, story.links, { mayRead, mayEdit: () => true });
  const p = await resolveTimelineProjection(w.source, story.links, {}, mayRead);

  // Every owner (world settings, ledger, scene cards, composition, characters) reads as valid.
  expect(p.owners.filter((o) => o.state !== 'valid')).toEqual([]);
  expect(p.scope).toBe('complete');
  // Every event is placed on the clock, and every event is cited by a scene (筋の網羅).
  const events = [...PART1_EVENTS, ...LATER_EVENTS];
  expect(p.events.map((e) => e.id).sort()).toEqual(events.map((e) => e.id).sort());
  expect(Object.values(p.unplaced).flat()).toEqual([]);
  expect(p.backEvents).toEqual([]);
  // Every scene's citations resolve, and every scene is placed in an episode.
  for (const s of p.scenes) {
    expect(s.cites.filter((c) => c.state !== 'resolved'), s.id).toEqual([]);
    expect(s.occurrences.length, s.id).toBeGreaterThan(0);
  }
  // 24 episodes in presentation order; the prologue scene comes back in the last episode.
  expect(new Set(p.occurrences.map((o) => o.part)).size).toBe(24);
  expect(p.occurrences.every((o) => o.scene.state === 'resolved' && o.sceneKey)).toBe(true);
  const orders = p.occurrences.map((o) => o.order);
  expect(orders).toEqual([...orders].sort((a, b) => a - b));
  const prologue = p.occurrences.filter((o) => o.scene.state === 'resolved' && o.scene.item === REPRISE.scene);
  expect(prologue.map((o) => o.part)).toEqual(['第1話', `第${REPRISE.episode}話`]);
  // Six episodes per part.
  expect(EPISODES.map((e) => e.n)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  // Every setup is shown before each of its payoffs (伏線は回収より前に張る).
  const firstOrder = new Map<string, number>();
  for (const o of p.occurrences)
    if (o.scene.state === 'resolved' && !firstOrder.has(o.scene.item)) firstOrder.set(o.scene.item, o.order);
  for (const pl of PLOTS) {
    for (const id of [...pl.setup, ...pl.payoff]) expect(firstOrder.has(id), `${pl.id} ${id}`).toBe(true);
    const lastSetup = Math.max(...pl.setup.map((id) => firstOrder.get(id)!));
    for (const id of pl.payoff) expect(firstOrder.get(id)!, `${pl.id} ${id}`).toBeGreaterThan(lastSetup);
  }
  // Dated events are in the text's order on the clock.
  const dated = events.filter((e) => e.time.kind === 'day').map((e) => (e.time as { day: number }).day);
  expect(dated).toEqual([...dated].sort((a, b) => a - b));

  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    for (const a of story.artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/artifacts/story-links.json`, JSON.stringify(story.links, null, 1));
    writeFileSync(`${out}/story-editor.json`, JSON.stringify(story));
  }
});
