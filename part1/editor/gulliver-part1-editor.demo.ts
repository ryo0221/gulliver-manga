// Manga part 1 (never committed to editor-platform): open the part 1 character sheet, relationship
// graph, world notes, world lines and clock, ledger, map and story board in the Playground and save
// screenshots. Run gulliver-part1.build.test.ts first; it writes the artifacts this test seeds.
import { mkdir, readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { expect, test } from '../e2e/fixtures';

const dir = process.env.EDITOR_OUT ?? '/tmp/claude-0/manga-part1-editor';
/** Written by gulliver-part1.build.test.ts (GM_OUT/part1-editor.json). */
const builtJson = process.env.PART1_JSON ?? '/tmp/claude-0/manga-part1-editor/part1-editor.json';

async function built(): Promise<{ artifacts: { id: string }[]; links: unknown; settingsId: string }> {
  return JSON.parse(await readFile(builtJson, 'utf8'));
}

/** Put the part 1 artifacts and Story links into this origin's storage, then reload. */
async function seed(page: Page, path: string) {
  const part = await built();
  await page.goto(path);
  await page.evaluate(
    async ({ artifacts, links, settingsId }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('editor-platform', 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('artifacts'))
            request.result.createObjectStore('artifacts', { keyPath: 'id' });
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction('artifacts', 'readwrite');
          for (const a of artifacts) tx.objectStore('artifacts').put(a);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
      localStorage.setItem('story-board:links', JSON.stringify(links));
      localStorage.setItem('story-timeline:links', JSON.stringify(links));
      localStorage.setItem('story-board:settings-id', settingsId);
    },
    part,
  );
  await page.reload();
  return part;
}

async function shot(page: Page, name: string) {
  await mkdir(dir, { recursive: true });
  await page.mouse.move(720, 890);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/${name}.png` });
}

/** The Playground opens a native artifact through its own import (it keeps the content as is). */
async function openInPlayground(page: Page, id: string) {
  const part = await built();
  const artifact = part.artifacts.find((a) => a.id === id) as { id: string; name: string };
  await page.goto('/');
  const input = page.getByLabel('Import artifact', { exact: true });
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Toggle library', exact: true }).click();
  await input.setInputFiles({ name: `${id}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(artifact)) });
  await expect(page.getByLabel('Artifact name')).toHaveValue(artifact.name);
  const close = page.getByRole('button', { name: 'Close library panel', exact: true });
  if (await close.isVisible()) await close.click();
}

test('part1: story board (characters on the timeline, map, event cards)', async ({ page }) => {
  await seed(page, '/story-board.html');
  await expect(page.getByRole('heading', { name: /第1部・物語ボード/ })).toBeVisible({ timeout: 60_000 });
  await shot(page, '01-story-board');
  const canvas = page.getByRole('button', { name: 'キャンバスへ', exact: true });
  if (await canvas.isVisible()) await canvas.click();
  const fit = page.getByRole('button', { name: 'Fit board', exact: true });
  if (await fit.isVisible()) await fit.click();
  await shot(page, '02-story-board-canvas');
  const slider = page.getByRole('slider', { name: '共通の時点', exact: true });
  for (const day of ['185', '860']) {
    await slider.fill(day);
    await shot(page, `03-story-board-day-${day}`);
  }
});

test('part1: story timeline reading (world line, clock, events)', async ({ page }) => {
  await seed(page, '/story-timeline.html');
  await page.waitForTimeout(3000);
  await shot(page, '04-story-timeline');
  await page.screenshot({ path: `${dir}/04-story-timeline-full.png`, fullPage: true });
  await page.getByRole('tab', { name: '世界線', exact: true }).or(page.getByRole('button', { name: '世界線', exact: true })).first().click();
  await shot(page, '04-story-timeline-worldline');
});

test('part1: character sheet table and relationship graph', async ({ page }) => {
  await openInPlayground(page, 'gm1-characters');
  await shot(page, '05-character-sheet');
  const menu = page.getByRole('button', { name: 'More editor tools', exact: true });
  const select = page.getByLabel('Data projection', { exact: true });
  if (!(await select.isVisible())) await menu.click();
  await select.selectOption('Graph');
  await page.keyboard.press('Escape');
  await shot(page, '06-relationship-graph');
  // A wider look at the relationship graph: side panels closed and the whole graph fitted.
  for (const name of ['グラフの設定']) await page.getByRole('button', { name, exact: true }).click();
  for (const panel of ['Data navigator', 'Data inspector']) {
    const close = page.getByRole('complementary', { name: panel }).getByRole('button', { name: /Close/ });
    if (await close.isVisible().catch(() => false)) await close.click();
  }
  await page.getByRole('button', { name: '全体を表示', exact: true }).click();
  await shot(page, '06-relationship-graph-wide');
});

test('part1: world notes, world lines and clock, ledger, dictionary', async ({ page }) => {
  for (const [id, file] of [
    ['gm1-world-notes', '07-world-notes'],
    ['gm1-world-settings', '08-world-lines-clock'],
    ['gm1-ledger', '09-ledger'],
    ['gm1-terms', '10-dictionary'],
  ] as const) {
    await openInPlayground(page, id);
    await shot(page, file);
  }
});

test('part1: map with places and routes', async ({ page }) => {
  await openInPlayground(page, 'gm1-map');
  await page.waitForTimeout(1500);
  await shot(page, '11-map');
});
