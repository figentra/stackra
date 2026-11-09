/**
 * Stackra file contract:
 * Purpose: hold the pre-commit oxlint step in `lefthook.yml` to `.oxlintrc.jsonc`: every generated source path oxlint
 *          ignores is excluded from the step too. oxlint exits 1 when every file it is given is ignored, so a commit of
 *          only regenerated files (a package's `entities.gen.ts`) would be refused by a hook that has nothing to lint;
 *          and the step passes `--no-error-on-unmatched-pattern`, so any other ignored file (a test fixture) passes too.
 * Boundary: reads the two files as text; no hook runs.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); STA-2588 (the refused gen-output commit).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** The generated source paths `.oxlintrc.jsonc` ignores, which a commit may stage on their own. */
const GENERATED = [
  "packages/*/*/src/node/entities.gen.ts",
  "**/encore.gen/**",
  "packages/*/api-client/src/generated/**",
];

test("the pre-commit oxlint step excludes every generated path oxlint ignores", () => {
  const oxlintrc = readFileSync(".oxlintrc.jsonc", "utf8");
  const lefthook = readFileSync("lefthook.yml", "utf8");
  const excluded = lefthook
    .slice(lefthook.indexOf("- name: oxlint"), lefthook.indexOf("- name: gitleaks"))
    .split("\n")
    .map((line) => line.trim());
  for (const path of GENERATED) {
    assert.ok(oxlintrc.includes(`"${path}"`), `.oxlintrc.jsonc no longer ignores ${path}`);
    assert.ok(
      excluded.some((line) => line === `- "${path}"`),
      `lefthook's oxlint step does not exclude ${path}`,
    );
  }
});

test("the pre-commit oxlint step passes a commit whose files oxlint all ignores", () => {
  const lefthook = readFileSync("lefthook.yml", "utf8");
  const step = lefthook.slice(
    lefthook.indexOf("- name: oxlint"),
    lefthook.indexOf("- name: gitleaks"),
  );
  // a test fixture oxlint ignores was refused with "No files found to lint" (#945's stand-in, #954)
  assert.match(step, /oxlint --no-error-on-unmatched-pattern "\$@"/);
});
