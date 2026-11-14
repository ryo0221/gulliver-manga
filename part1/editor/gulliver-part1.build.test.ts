// Builds the part 1 native artifacts and writes them as JSON (GM_OUT), after checking that the
// story board opens them. Run with vitest from apps/artifact-host/src/creative/story-board/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { test, expect } from 'vitest';
import { MemoryStorage, type Artifact } from '@editor-platform/artifact-core';
import { buildGulliverPart1 } from './gulliver-part1';
import { StoryBoardController } from './controller';

test('gulliver part 1 builds and the story board opens it', async () => {
  const map = process.env.LILLIPUT_MAP ?? '/mnt/project-files/gulliver-world/gv1/lilliput.fiction-map.json';
  const part = await buildGulliverPart1(JSON.parse(readFileSync(map, 'utf8')));
  const storage = new MemoryStorage<Artifact<unknown>>();
  for (const a of part.artifacts) await storage.put(a);
  const board = await StoryBoardController.open(storage, part.settingsId, part.links, {
    namespace: 'gulliver-part1',
    mayRead: () => true,
    mayEdit: () => true,
  });
  expect(board).toBeTruthy();
  board.close();
  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/artifacts`, { recursive: true });
    for (const a of part.artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
    writeFileSync(`${out}/artifacts/story-links.json`, JSON.stringify(part.links, null, 1));
    writeFileSync(`${out}/part1-editor.json`, JSON.stringify(part));
  }
});
