/**
 * Stackra file contract:
 * Purpose: hold the pre-commit oxlint step in `lefthook.yml` to `.oxlintrc.jsonc`: every generated source path oxlint
 *          ignores is excluded from the step too. oxlint exits 1 when every file it is given is ignored, so a commit of
 *          only regenerated files (a package's `entities.gen.ts`) would be refused by a hook that has nothing to lint.
 *          The preset's own `lefthook.yml` (what every other repository renders) is held to the same rule for the guard
 *          bundles `fflow sync` writes: a commit staging only `.opencode/plugins/fflow-guard.mjs` failed oxlint with
 *          "No files found to lint" in a repository whose oxlint config ignores it.
 * Boundary: reads the files as text; no hook runs.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); STA-2588 (the refused gen-output commit).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

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

test("the preset's pre-commit oxfmt and oxlint steps exclude every guard bundle fflow sync writes", () => {
  const preset = readFileSync(
    "packages/developer/flow-preset/preset/surfaces/lefthook.yml",
    "utf8",
  );
  // Each `- name: <job>` starts a block that runs to the next one, whatever order the jobs come in; the first of a name wins.
  const jobs = new Map();
  for (const block of preset.split(/^\s*- name: /m).slice(1)) {
    const name = block.split("\n")[0].trim();
    if (!jobs.has(name)) jobs.set(name, block);
  }
  const bundles = [
    ".agents/hooks/fflow-guard.mjs",
    ...readdirSync("packages/developer/flow-preset/preset/surfaces/opencode/plugins").map(
      (file) => `.opencode/plugins/${file}`,
    ),
  ];
  for (const job of ["oxfmt", "oxlint"]) {
    const text = jobs.get(job);
    assert.ok(text !== undefined, `the preset has no ${job} step`);
    const excluded = new Set(text.split("\n").map((line) => line.trim()));
    for (const bundle of bundles)
      assert.ok(
        excluded.has(`- "${bundle}"`),
        `the preset's ${job} step does not exclude ${bundle}`,
      );
  }
});
