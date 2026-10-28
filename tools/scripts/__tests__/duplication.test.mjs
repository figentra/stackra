/**
 * Stackra file contract:
 * Purpose: hold `duplication.mjs` to its contract: a member whose src percentage rises above its baseline row fails, an
 *          equal or lower one passes, a member with no row fails only above the cap, a placeholder baseline yields
 *          nothing; members are measured per `src/` with tests apart, at the baseline's min-tokens; the report totals
 *          and the jscpd arguments are what B-9 asks for.
 * Boundary: writes fixture workspaces into temp directories and runs a fake jscpd; reads nothing of this checkout.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); notes handover/testing/rule-gap-list.md B-9.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  baselineDocument,
  DEFAULT_SETTINGS,
  jscpdArgs,
  measureMembers,
  ratchetFindings,
  reportTotals,
} from "../duplication.mjs";

/** A jscpd JSON report with these totals. */
const report = (lines, duplicatedLines) => ({ statistics: { total: { lines, duplicatedLines } } });

test("reportTotals gives the duplicated percentage to two decimals, 0 for an empty scan", () => {
  assert.deepEqual(reportTotals(report(300, 10)), { lines: 300, duplicated: 10, percentage: 3.33 });
  assert.equal(reportTotals(report(0, 0)).percentage, 0);
  assert.equal(reportTotals({}).percentage, 0);
});

test("jscpdArgs scans src without tests, or the tests alone, at the given min-tokens into a JSON report", () => {
  const src = jscpdArgs("packages/data/a/src", "src", 50, "/tmp/out");
  assert.equal(src[0], "packages/data/a/src");
  assert.equal(src[src.indexOf("--min-tokens") + 1], "50");
  assert.equal(src[src.indexOf("--ignore") + 1], "**/__tests__/**");
  assert.equal(src[src.indexOf("--reporters") + 1], "json");
  assert.equal(src[src.indexOf("--output") + 1], "/tmp/out");
  const tests = jscpdArgs("packages/data/a/src", "tests", 50, "/tmp/out");
  assert.equal(tests[tests.indexOf("--pattern") + 1], "**/__tests__/**");
  assert.ok(!tests.includes("--ignore"));
});

test("measureMembers runs jscpd per member src, tests apart, and skips members without src", () => {
  const root = mkdtempSync(join(tmpdir(), "duplication-"));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*/*\n");
  for (const [dir, name, hasSrc] of [
    ["packages/data/a", "@stackra/a", true],
    ["packages/data/b", "@stackra/b", false],
  ]) {
    mkdirSync(join(root, dir, hasSrc ? "src" : ""), { recursive: true });
    writeFileSync(join(root, dir, "package.json"), JSON.stringify({ name }));
  }
  const calls = [];
  const measured = measureMembers(root, 70, (...args) => {
    calls.push(args);
    return args[2] === "src" ? report(200, 20) : report(100, 50);
  });
  assert.deepEqual(measured, { "packages/data/a": { src: 10, tests: 50 } });
  assert.deepEqual(calls, [
    [root, join("packages/data/a", "src"), "src", 70],
    [root, join("packages/data/a", "src"), "tests", 70],
  ]);
});

test("ratchetFindings fails on growth over the row and on a new member over the cap, and nothing else", () => {
  const baseline = {
    minTokens: 50,
    newMemberCap: 5,
    members: { "packages/data/a": { src: 4, tests: 9 }, "packages/data/b": { src: 12, tests: 0 } },
  };
  const findings = ratchetFindings(baseline, {
    "packages/data/a": { src: 4.01, tests: 0 },
    "packages/data/b": { src: 12, tests: 40 },
    "packages/data/c": { src: 5, tests: 0 },
    "packages/data/d": { src: 5.5, tests: 0 },
  });
  assert.deepEqual(
    findings.map(({ dir }) => dir),
    ["packages/data/a", "packages/data/d"],
  );
  assert.match(findings[0].text, /from 4% to 4.01%/);
  assert.match(findings[1].text, /above the 5% cap/);
  assert.deepEqual(ratchetFindings(baseline, { "packages/data/b": { src: 1, tests: 0 } }), []);
});

test("a placeholder baseline (no members yet) yields no findings", () => {
  assert.deepEqual(
    ratchetFindings({ minTokens: 50 }, { "packages/data/a": { src: 90, tests: 0 } }),
    [],
  );
  assert.deepEqual(ratchetFindings(undefined, { "packages/data/a": { src: 90, tests: 0 } }), []);
});

test("baselineDocument keeps the settings and replaces the members", () => {
  const measured = { "packages/data/a": { src: 1, tests: 2 } };
  assert.deepEqual(baselineDocument({ minTokens: 60, newMemberCap: 3, members: {} }, measured), {
    minTokens: 60,
    newMemberCap: 3,
    members: measured,
  });
  assert.deepEqual(baselineDocument({}, measured), { ...DEFAULT_SETTINGS, members: measured });
});
