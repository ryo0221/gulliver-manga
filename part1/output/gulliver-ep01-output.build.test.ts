// 出版準備 第1話: captures the fixed version of the finished pages (the one the 通読 read) as vector pages
// for export-ep.mjs, and builds the 出力の記録 when the outputs exist (GM_OUTPUTS/outputs.json).
// Run with vitest from apps/artifact-host/src/creative/story-board/ next to gulliver-ep01-read.ts.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import type { Artifact } from '@editor-platform/artifact-core';
import { captureDesignPages } from '@editor-platform/design/pagination';
import type { DesignContent } from '@editor-platform/design/model';
import { READ_VERSIONS } from './gulliver-ep01-read';
import { buildGulliverEp01Output, colophonHtml, type Outputs } from './gulliver-ep01-output';

const FINISH = process.env.GM_FINISH ?? new URL('./gulliver-ep01-finish/', import.meta.url).pathname;

test('episode 1 output comes from the fixed version the read-through read', async () => {
  const design = JSON.parse(readFileSync(`${FINISH}/artifacts/gm1-ep01-finish.artifact.json`, 'utf8')) as Artifact<DesignContent>;
  const fixed = READ_VERSIONS.find((v) => v.artifact === 'gm1-ep01-finish')!;
  // output.from-fixed: the export is captured from the exact version the read-through fixed.
  expect(design.versions.map((v) => v.versionId)).toContain(fixed.version);
  const capture = await captureDesignPages(design, fixed.version, { mode: 'vector' });
  expect(capture.ok, JSON.stringify(capture.manifest.diagnostics)).toBe(true);
  expect(capture.pages.length).toBe(16);
  expect(capture.manifest.source.versionId).toBe(fixed.version);

  const out = process.env.GM_OUT;
  if (out) {
    mkdirSync(`${out}/pages`, { recursive: true });
    capture.pages.forEach((p, i) => writeFileSync(`${out}/pages/page-${String(i + 1).padStart(2, '0')}.svg`, p.svg));
    writeFileSync(`${out}/pages/manifest.json`, JSON.stringify(capture.manifest, null, 1));
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
