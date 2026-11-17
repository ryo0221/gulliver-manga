// Builds episode 2's 学びの記録 (fiction-manga@1.3.0 学び). Each learning names where it came from (a finding of the
// read-through or a phase) and what to do in the next episode; the choice stays with the author (learning.chosen).
// Run with vitest from apps/artifact-host/src/creative/story-board/ next to gulliver-ep01-read.ts. GM_OUT writes JSON.
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { FINDINGS_EP02 as FINDINGS } from './gulliver-ep02-read';
import { buildGulliverEp02Learning, CHOSEN_BY_EP02 as CHOSEN_BY, LEARNINGS_EP02 as LEARNINGS } from './gulliver-ep02-learning';

test('episode 2 学びの記録 ties each learning to its source and leaves the choice to the author', async () => {
  const findings = new Set(FINDINGS.map((f) => f.id));
  const ids = new Set<string>();
  for (const l of LEARNINGS) {
    expect(l.id).toMatch(/^LN-e02-\d{2}$/);
    expect(ids.has(l.id), l.id).toBe(false);
    ids.add(l.id);
    for (const rv of l.source.match(/RV-e02-\d{2}/g) ?? []) expect(findings.has(rv), `${l.id} ${rv}`).toBe(true);
    expect(l.next.length, l.id).toBeGreaterThan(10);
    // learning.chosen is the author's: the AI only proposes; a choice other than waiting names the author's word.
    if (l.choice !== '作者の選択待ち') expect(CHOSEN_BY).toMatch(/^作者/);
  }
  const artifacts = await buildGulliverEp02Learning();
  expect(artifacts.map((a) => a.id)).toEqual(['gm1-ep02-learning']);
  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    for (const a of artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/learning-editor.json`, JSON.stringify({ artifacts }));
  }
});
