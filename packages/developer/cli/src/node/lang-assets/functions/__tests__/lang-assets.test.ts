/**
 * Stackra file contract:
 * Purpose: hold the lang-catalogue export check of `stackra validate --repository` to its contract (STA-1798): a package
 *          with `assets/lang/` that exports `./assets/*` and ships `assets` passes; one missing the export, or leaving
 *          `assets` out of `files`, is reported with its folder; a package without `assets/lang/` is not checked; and
 *          this checkout passes.
 * Boundary: writes fixture trees into temp directories, and reads this checkout's packages for the last case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0305 (rule 1).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@stackra/testing";

import { langAssetsFindings } from "#node/lang-assets/functions/lang-assets-findings.function";

/** A temp checkout holding `files` (path to content). */
function checkout(files: Readonly<Record<string, string>>): string {
  const root = mkdtempSync(join(tmpdir(), "lang-assets-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(root, dirname(file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return root;
}

/** A package.json with `exports` keys and `files`. */
const manifest = (exports: readonly string[], files: readonly string[]): string =>
  JSON.stringify({
    exports: Object.fromEntries(exports.map((key) => [key, key === "./assets/*" ? key : {}])),
    files,
  });

const CATALOGUE = "packages/security/access-log/assets/lang/en/access_log.json";

test("a package that exports and ships its catalogues passes", () => {
  const root = checkout({
    "packages/security/access-log/package.json": manifest([".", "./assets/*"], ["dist", "assets"]),
    [CATALOGUE]: "{}",
  });
  assert.deepEqual(langAssetsFindings(root), []);
});

test("a package missing the export or leaving assets out of files is reported", () => {
  const root = checkout({
    "packages/security/access-log/package.json": manifest(["."], ["dist"]),
    [CATALOGUE]: "{}",
  });
  const findings = langAssetsFindings(root);
  assert.deepEqual(
    findings.map((finding) => finding.dir),
    ["packages/security/access-log", "packages/security/access-log"],
  );
  assert.match(findings[0]?.text ?? "", /exports has no "\.\/assets\/\*"/);
  assert.match(findings[1]?.text ?? "", /files leaves "assets" out/);
});

test("a package without lang catalogues is not checked", () => {
  const root = checkout({ "packages/data/tags/package.json": manifest(["."], ["dist"]) });
  assert.deepEqual(langAssetsFindings(root), []);
});

test("this checkout's packages export and ship their catalogues", () => {
  assert.deepEqual(
    langAssetsFindings(fileURLToPath(new URL("../../../../../../../../", import.meta.url))),
    [],
  );
});
