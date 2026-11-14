// Manga part 1 (never committed): 3D underlays (LY-01) for the setting art. Figures front/side/back
// from the character rigs; the temple and Mildendo path-traced from the BIM models.
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { createArtifact } from '@editor-platform/artifact-core';
import { emptyCharacter } from '@editor-platform/character-core';
import type { Page } from '@playwright/test';
import { addFigure, gulliverLook, lilliputLooks } from '../../scripts/fixtures/gulliver-people';
import { f105Mildendo, f106Temple } from '../../scripts/fixtures/gulliver-lilliput';
import { create, expect, nativeArtifact, test } from '../e2e/fixtures';

const dir = process.env.UNDERLAY_OUT ?? '/tmp/claude-0/manga-underlay';
const viewState = (page: Page) => page.getByTestId('character-view-state');

async function importJson(page: Page, name: string, value: unknown) {
  const input = page.getByLabel('Import artifact', { exact: true });
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Toggle library', exact: true }).click();
  await input.setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
}

async function figureDoc(page: Page, name: string, people: { heightMm: number; look: typeof gulliverLook; facingRad: number; x: number }[]) {
  await page.goto('/');
  await create(page, 'character');
  await expect(viewState(page)).toHaveText('Ready');
  const starter = await nativeArtifact(page);
  const doc = emptyCharacter(name);
  const assets = new Map<string, Uint8Array>();
  people.forEach((p, i) => addFigure(doc, assets, { prefix: `p${i}`, name: `${name}-${i}`, heightMm: p.heightMm, look: p.look, facingRad: p.facingRad, at: [p.x, 0, 0] }));
  const resources = doc.assets.map((ref) => ({ kind: ref.kind, sha256: ref.sha256, byteLength: ref.byteLength, mediaType: ref.mediaType, encoding: 'base64', bytes: Buffer.from(assets.get(ref.id)!).toString('base64') }));
  await importJson(page, `${name}.json`, { ...starter, name, draft: { ...starter.draft, content: doc }, cadResources: resources });
  await expect(page.getByLabel('Artifact name')).toHaveValue(name);
  await expect(viewState(page)).toHaveText('Ready');
  await page.waitForTimeout(800);
  await mkdir(dir, { recursive: true });
  await page.locator('.character-canvas').screenshot({ path: `${dir}/${name}.png` });
}

const views: [string, number][] = [['front', Math.PI], ['side', Math.PI / 2], ['back', 0]];
for (const [view, facing] of views) {
  test(`underlay: Gulliver ${view}`, async ({ page }) => {
    await figureDoc(page, `ch01-gulliver-${view}`, [{ heightMm: 1750, look: gulliverLook, facingRad: facing, x: 0 }]);
  });
  test(`underlay: Lilliputian ${view}`, async ({ page }) => {
    await figureDoc(page, `lilliputian-${view}`, [{ heightMm: 146, look: lilliputLooks[0]!, facingRad: facing, x: 0 }]);
  });
}
test('underlay: Gulliver and a Lilliputian side by side', async ({ page }) => {
  await figureDoc(page, 'scale-gulliver-lilliputian', [
    { heightMm: 1750, look: gulliverLook, facingRad: Math.PI, x: 0 },
    { heightMm: 146, look: lilliputLooks[0]!, facingRad: Math.PI, x: 500 },
  ]);
});

async function renderBim(page: Page, name: string, doc: unknown) {
  await page.goto('/');
  await importJson(page, `${name}.json`, createArtifact('bim', name, doc as never));
  await expect(page.getByTestId('bim-model-state')).toHaveText('Model up to date', { timeout: 300_000 });
  await mkdir(dir, { recursive: true });
  await page.getByTestId('bim-viewport').screenshot({ path: `${dir}/${name}-view.png` });
  await page.getByRole('button', { name: 'Render image', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Render image' });
  await dialog.getByLabel('Width (px)').fill('1280');
  await dialog.getByLabel('Height (px)').fill('720');
  await dialog.getByLabel('Samples').fill('32');
  await dialog.getByLabel('Time limit (s, 0 = none)').fill('900');
  await dialog.getByRole('button', { name: 'Render', exact: true }).click();
  await expect(dialog.getByTestId('view-render-done')).toHaveText(/^1280 × 720 px/, { timeout: 1_800_000 });
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Save PNG' }).click();
  await writeFile(`${dir}/${name}.png`, await readFile((await (await download).path())!));
}
test('underlay: LO-03 the old temple', async ({ page }) => {
  await renderBim(page, 'lo03-temple', f106Temple());
});
test('underlay: LO-04 Mildendo', async ({ page }) => {
  await renderBim(page, 'lo04-mildendo', f105Mildendo().doc);
});
