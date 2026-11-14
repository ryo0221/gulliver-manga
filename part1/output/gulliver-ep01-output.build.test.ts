// 出版準備 第1話: captures the fixed version of the finished pages (the one the 通読 read) as vector pages
// for export-ep.mjs, and builds the 出力の記録 when the outputs exist (GM_OUTPUTS/outputs.json).
// Run with vitest from apps/artifact-host/src/creative/story-board/ next to gulliver-ep01-read.ts.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { commitVersion, type Artifact } from '@editor-platform/artifact-core';
import { captureDesignPages } from '@editor-platform/design/pagination';
import type { DesignContent } from '@editor-platform/design/model';
import { READ_VERSIONS } from './gulliver-ep01-read';
import { forExport } from './gulliver-ep01-finish';
import { buildGulliverEp01Output, colophonHtml, type Outputs } from './gulliver-ep01-output';

const FINISH = process.env.GM_FINISH ?? new URL('./gulliver-ep01-finish/', import.meta.url).pathname;

test('episode 1 output comes from the fixed version the read-through read', async () => {
  const design = JSON.parse(readFileSync(`${FINISH}/artifacts/gm1-ep01-finish.artifact.json`, 'utf8')) as Artifact<DesignContent>;
  const fixed = READ_VERSIONS.find((v) => v.artifact === 'gm1-ep01-finish')!;
  // output.from-fixed: the export is captured from the exact version the read-through fixed.
  expect(design.versions.map((v) => v.versionId)).toContain(fixed.version);
  const version = design.versions.find((v) => v.versionId === fixed.version)!;
  // The fixed version itself captures (its provenance), but its memo groups (camera tags, 絵：… drawing notes) are
  // production notes: the publication pages are the fixed version's content with the memo groups hidden (forExport,
  // as the finish build does), committed as an export-only version whose parent is the fixed version.
  const check = await captureDesignPages(design, fixed.version, { mode: 'vector' });
  expect(check.ok, JSON.stringify(check.manifest.diagnostics)).toBe(true);
  expect(check.manifest.source.versionId).toBe(fixed.version);
  const exported = await commitVersion({ ...design, draft: { ...design.draft, content: forExport(version.content) }, versions: [] } as never, null, `出版準備 第1話（${fixed.artifact}@${fixed.version} のメモを隠した書き出し）`);
  const exportVersion = (exported as Artifact<DesignContent>).versions[0]!;
  const capture = await captureDesignPages(exported as never, exportVersion.versionId, { mode: 'vector' });
  expect(capture.ok, JSON.stringify(capture.manifest.diagnostics)).toBe(true);
  expect(capture.pages.length).toBe(16);
  const svg = capture.pages.map((p) => p.svg).join('');
  expect(check.pages.map((p) => p.svg).join('').includes('絵：'), 'the fixed version shows the memo').toBe(true);
  expect(svg.includes('絵：'), 'the publication pages hide the memo').toBe(false);
  // Only the memo groups differ from the fixed version.
  const differ = version.content.elements.filter((e, i) => JSON.stringify(e) !== JSON.stringify(exportVersion.content.elements[i]));
  expect(differ.length).toBeGreaterThan(0);
  for (const e of differ) expect(e.name, e.id).toMatch(/^メモ/);
  const source = { artifactId: fixed.artifact, versionId: fixed.version, contentHash: version.contentHash, exportFilter: 'メモのグループ（カメラの札と描き方の覚え書き）を隠した（forExport）', exportContentHash: exportVersion.contentHash };

  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/pages`, { recursive: true });
    capture.pages.forEach((p, i) => writeFileSync(`${out}/pages/page-${String(i + 1).padStart(2, '0')}.svg`, p.svg));
    writeFileSync(`${out}/pages/manifest.json`, JSON.stringify(capture.manifest, null, 1));
    writeFileSync(`${out}/pages/source.json`, JSON.stringify(source, null, 1));
    // The 奥付 with the AI disclosure goes at the end of the episode (export-ep.mjs renders it last).
    writeFileSync(`${out}/pages/colophon.html`, colophonHtml());
  }
  const outputsPath = process.env.GM_OUTPUTS;
  if (outputsPath && existsSync(`${outputsPath}/outputs.json`)) {
    const outputs = JSON.parse(readFileSync(`${outputsPath}/outputs.json`, 'utf8')) as Outputs;
    // Every output names the fixed version as its source.
    expect(outputs.source.artifactId).toBe('gm1-ep01-finish');
    expect(outputs.source.versionId).toBe(fixed.version);
    expect(outputs.files.filter((f) => f.format === 'PNG' && typeof f.page === 'number').length).toBe(16);
    expect(outputs.files.filter((f) => f.page === 'colophon').length).toBe(1);
    expect(outputs.files.find((f) => f.format === 'PDF')!.pages).toBe(17);
    expect(outputs.files.filter((f) => f.format === 'PDF').length).toBe(1);
    const artifacts = await buildGulliverEp01Output(outputs);
    if (out) {
      mkdirSync(`${out}/artifacts`, { recursive: true });
      for (const a of artifacts) writeFileSync(`${out}/artifacts/${a.id}.artifact.json`, JSON.stringify(a, null, 1));
      writeFileSync(`${out}/output-editor.json`, JSON.stringify({ artifacts }));
    }
  }
});
