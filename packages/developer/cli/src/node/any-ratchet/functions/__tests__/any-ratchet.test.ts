/**
 * Stackra file contract:
 * Purpose: hold `stackra any-ratchet` (was `any-ratchet.mjs`) to its contract: it counts every disable comment that names `no-explicit-any`
 *          (oxlint and eslint, next-line, line and block forms) per package under `packages/`, skips build output and
 *          members outside `packages/`, fails a package above its baseline (0 when unlisted), lists a package below its
 *          baseline, and the committed baseline parses to whole numbers.
 * Boundary: writes fixture workspaces into temp directories; reads only the committed baseline of this checkout.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (tests live in tests folders); rule-gap list N-5; stackra-229 (STA-1388).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@stackra/testing";

import { anyDisableCounts } from "#node/any-ratchet/functions/any-disable-counts.function";
import { anyRatchetFindings } from "#node/any-ratchet/functions/any-ratchet-findings.function";
import { loweredBaselines } from "#node/any-ratchet/functions/lowered-baselines.function";
import { readBaseline } from "#node/any-ratchet/functions/read-baseline.function";

/** The rule and directive names, split so this file holds no disable comment the ratchet itself would count. */
const RULE = ["no", "explicit", "any"].join("-");
const DISABLE = ["oxlint", "disable"].join("-");
const ANY = `// ${DISABLE}-next-line typescript/${RULE} -- reason: a wire type\n`;

/** A temp workspace: `files` maps a repository path to its text; each member gets a package.json from `members`. */
function workspace(members: Record<string, string>, files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "any-ratchet-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*/*\n");
  for (const [dir, name] of Object.entries(members)) {
    mkdirSync(join(root, dir), { recursive: true });
    writeFileSync(join(root, dir, "package.json"), JSON.stringify({ name }));
  }
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

const MEMBERS = {
  "packages/data/model": "@stackra/model",
  "packages/experience/panel": "@stackra/panel",
  "apps/web": "@figentra/web",
};

test("every disable form that names no-explicit-any counts, per package", () => {
  const root = workspace(MEMBERS, {
    "packages/data/model/src/core/a.ts": `${ANY}export type A = any;\n`,
    "packages/data/model/src/core/__tests__/a.test.tsx": `${ANY}const x: any = 1; // eslint-disable-line @typescript-eslint/${RULE} -- test\n`,
    "packages/data/model/src/core/b.mts": `/* ${DISABLE} typescript/${RULE} -- reason: generated */\n`,
    "packages/data/model/dist/index.js": ANY,
    "packages/data/model/node_modules/x/index.js": ANY,
    "packages/experience/panel/src/core/c.ts": `// ${DISABLE}-next-line typescript/no-non-null-assertion -- reason: x\n`,
    "apps/web/src/d.ts": ANY,
  });
  assert.deepEqual([...anyDisableCounts(root)], [["packages/data/model", 4]]);
});

test("a package above its baseline is a finding; at or below it is not", () => {
  const root = workspace(MEMBERS, {
    "packages/data/model/src/core/a.ts": `${ANY}${ANY}`,
    "packages/experience/panel/src/core/c.ts": ANY,
  });
  const findings = anyRatchetFindings(root, { "packages/data/model": 2 });
  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.dir, "packages/experience/panel");
  assert.match(
    findings[0]?.text ?? "",
    /^1 `no-explicit-any` disable comments, above the baseline of 0/,
  );
  assert.deepEqual(
    anyRatchetFindings(root, { "packages/data/model": 3, "packages/experience/panel": 1 }),
    [],
  );
});

test("a package below its baseline is listed so the baseline shrinks", () => {
  const root = workspace(MEMBERS, { "packages/data/model/src/core/a.ts": ANY });
  assert.deepEqual(
    loweredBaselines(root, { "packages/data/model": 3, "packages/experience/panel": 1 }),
    ["packages/data/model: 1 < 3", "packages/experience/panel: 0 < 1"],
  );
});

test("the committed baseline holds whole numbers for packages only", () => {
  const root = fileURLToPath(new URL("../../../../../../../../", import.meta.url));
  const baseline = readBaseline(root);
  assert.ok(Object.keys(baseline).length > 0);
  for (const [dir, count] of Object.entries(baseline)) {
    assert.match(dir, /^packages\/[a-z-]+\/[a-z0-9-]+$/);
    assert.ok(Number.isInteger(count) && count > 0, dir);
  }
});
