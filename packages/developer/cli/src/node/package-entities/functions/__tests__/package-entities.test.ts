/**
 * Stackra file contract:
 * Purpose: hold the package entity-list check of `stackra validate --repository` to its contract (STA-1793): a package
 *          with own models whose stand-in `./node` barrel exports `<MEMBER>_ENTITIES` from the committed `#node/entities.gen`
 *          passes (STA-1874; one from the gitignored `#stackra/entities` does not); one that does not export it is
 *          reported with its folder; a package with no own models (only another package's), or no stand-in barrel, is
 *          not checked; and this checkout passes.
 * Boundary: writes fixture trees into temp directories, and reads this checkout's packages for the last case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0294 (decision 15).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@stackra/testing";

import { packageEntitiesFindings } from "#node/package-entities/functions/package-entities-findings.function";

/** A temp checkout holding `files` (path to content). */
function checkout(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), "package-entities-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(root, dirname(file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return root;
}

/** A manifest of `member` with `models`. */
const manifest = (member: string, models: readonly object[]): string =>
  JSON.stringify({ member, models });

test("a package with own models that re-exports its committed entity list passes", () => {
  const root = checkout({
    "packages/security/scope/stackra.manifest.json": manifest("scope", [{ class: "ScopeNode" }]),
    "packages/security/scope/src/node/index.ts":
      'export { ScopeNode } from "#node/models/scope-node.model";\nexport { SCOPE_ENTITIES } from "#node/entities.gen";\n',
  });
  assert.deepEqual(packageEntitiesFindings(root), []);
});

test("a re-export from the gitignored #stackra/entities is reported (STA-1874)", () => {
  const root = checkout({
    "packages/security/scope/stackra.manifest.json": manifest("scope", [{ class: "ScopeNode" }]),
    "packages/security/scope/src/node/index.ts":
      'export { SCOPE_ENTITIES } from "#stackra/entities/scope";\n',
  });
  assert.equal(packageEntitiesFindings(root).length, 1);
});

test("a package with own models whose barrel misses the list is reported", () => {
  const root = checkout({
    "packages/security/access-log/stackra.manifest.json": manifest("access_log", [
      { class: "AccessLogEntry" },
    ]),
    "packages/security/access-log/src/node/index.ts":
      'export { AccessLogEntry } from "#node/models/access-log-entry.model";\n',
  });
  const findings = packageEntitiesFindings(root);
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.dir, "packages/security/access-log");
  assert.match(findings[0]?.text ?? "", /ACCESS_LOG_ENTITIES from "#node\/entities\.gen"/);
});

test("a package with no own models or no stand-in barrel is not checked", () => {
  const root = checkout({
    "packages/data/media/stackra.manifest.json": manifest("media", [
      { class: "Asset", from: "@stackra/content" },
    ]),
    "packages/data/media/src/node/index.ts": "export {};\n",
    "packages/data/tags/stackra.manifest.json": manifest("tags", [{ class: "Tag" }]),
  });
  assert.deepEqual(packageEntitiesFindings(root), []);
});

test("this checkout's packages all export their entity lists", () => {
  assert.deepEqual(
    packageEntitiesFindings(fileURLToPath(new URL("../../../../../../../../", import.meta.url))),
    [],
  );
});
