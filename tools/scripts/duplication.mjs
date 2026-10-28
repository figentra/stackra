#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the copy-paste ratchet of `pnpm validate` (rule-gap B-9, stackra-235, owner D11): runs jscpd once per
 *          workspace member over its `src/` (`__tests__/` measured on its own) and compares each member's duplicated
 *          line percentage with `duplication-baseline.yaml`. It fails when a member's source percentage rises above
 *          its baseline, or above `newMemberCap` for a member the baseline does not list yet; a drop passes (refresh
 *          the baseline to lock it in). `--update` rewrites the baseline from the current tree. The burn-down of the
 *          members already over the cap is FB-9.
 * Boundary: reads pnpm-workspace.yaml, each member's src/ (through jscpd) and the baseline; writes only the baseline
 *           (with `--update`) and jscpd's JSON report in a temp directory it removes. Run directly it prints the
 *           findings as `<dir>: <finding>` and exits 1, or prints nothing and exits 0.
 * Runtime: node (spawns the jscpd binary of catalog:quality)
 * Governing contract: notes handover/testing/rule-gap-list.md B-9; ADR 0022 (tests beside the code).
 * Scope: every member the `packages` globs of pnpm-workspace.yaml match that has a `src/` folder.
 * Owner: release-operations · Secrets: forbidden
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse, stringify } from "yaml";

import { readWorkspaceMembers } from "./package-cycles.mjs";

// oxlint-disable stackra/one-declaration-per-file -- reason: a plain-node script module run by pnpm validate, not member source (like package-cycles.mjs); its tests import these names

/** The baseline file, repository-relative. Repo-owned data read by tools/scripts is YAML (the YAML standard). */
export const BASELINE_PATH = "tools/scripts/duplication-baseline.yaml";

/** The test folders, measured apart from the source: most of the largest clones are test-to-test (B-9). */
const TESTS_GLOB = "**/__tests__/**";

/** The settings a baseline without its own values falls back to (rule-gap B-9). */
export const DEFAULT_SETTINGS = Object.freeze({ minTokens: 50, newMemberCap: 5 });

/** `lines` and `duplicatedLines` of a jscpd JSON report as `{ lines, duplicated, percentage }` (two decimals). */
export function reportTotals(report) {
  const total = report?.statistics?.total ?? {};
  const lines = Number(total.lines ?? 0);
  const duplicated = Number(total.duplicatedLines ?? 0);
  const percentage = lines > 0 ? Math.round((duplicated / lines) * 10_000) / 100 : 0;
  return { lines, duplicated, percentage };
}

/** The jscpd arguments for one part (`src` without tests, or `tests` only) of the folder `srcDir`. */
export function jscpdArgs(srcDir, part, minTokens, output) {
  return [
    srcDir,
    "--min-tokens",
    String(minTokens),
    "--format",
    "typescript,tsx,javascript,jsx",
    part === "tests" ? "--pattern" : "--ignore",
    TESTS_GLOB,
    "--reporters",
    "json",
    "--output",
    output,
    "--silent",
  ];
}

/** Runs the jscpd binary of `root` on one part of `srcDir` into a temp folder and returns its JSON report. */
function runJscpd(root, srcDir, part, minTokens) {
  const output = mkdtempSync(join(tmpdir(), "duplication-"));
  try {
    const result = spawnSync(
      join(root, "node_modules", ".bin", "jscpd"),
      jscpdArgs(srcDir, part, minTokens, output),
      { cwd: root, encoding: "utf8" },
    );
    const reportFile = join(output, "jscpd-report.json");
    if (result.status !== 0 || !existsSync(reportFile))
      throw new Error(
        `jscpd failed on ${srcDir} (${part}): ${result.error?.message ?? result.stderr}`,
      );
    return JSON.parse(readFileSync(reportFile, "utf8"));
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
}

/**
 * Every member with a `src/` under `root` to `{ src, tests }` duplicated percentages, sorted by folder. `run` is the
 * jscpd runner (`(root, srcDir, part, minTokens) => report`); tests pass a fake.
 * shortcut: one jscpd process per member and part, so cross-member clones are not counted; run jscpd once over the
 * whole tree when the ratchet needs them (FB-9).
 */
export function measureMembers(root, minTokens = DEFAULT_SETTINGS.minTokens, run = runJscpd) {
  const measured = {};
  for (const { dir } of readWorkspaceMembers(root)) {
    const srcDir = join(dir, "src");
    if (!existsSync(join(root, srcDir))) continue;
    measured[dir] = {
      src: reportTotals(run(root, srcDir, "src", minTokens)).percentage,
      tests: reportTotals(run(root, srcDir, "tests", minTokens)).percentage,
    };
  }
  return measured;
}

/**
 * The ratchet findings (`{ dir, text }`, as @stackra/repo-checks reports them) of `measured` against `baseline`
 * (the parsed YAML). A baseline whose `members` is not yet generated yields no findings: the committed placeholder
 * stays green until ci-box writes the first one with `--update`.
 */
export function ratchetFindings(baseline, measured) {
  const members = baseline?.members;
  if (!members || typeof members !== "object") return [];
  const cap = Number(baseline.newMemberCap ?? DEFAULT_SETTINGS.newMemberCap);
  const findings = [];
  for (const [dir, { src }] of Object.entries(measured)) {
    const known = members[dir]?.src;
    if (typeof known === "number" && src > known)
      findings.push({
        dir,
        text: `duplication rose from ${known}% to ${src}% of src (jscpd --min-tokens ${baseline.minTokens ?? DEFAULT_SETTINGS.minTokens}); remove the copy, or refresh ${BASELINE_PATH} with the owner's approval`,
      });
    else if (typeof known !== "number" && src > cap)
      findings.push({
        dir,
        text: `duplication is ${src}% of src, above the ${cap}% cap for a member not in ${BASELINE_PATH}`,
      });
  }
  return findings;
}

/** The baseline document for `measured`, keeping the settings of `previous`. */
export function baselineDocument(previous, measured) {
  return {
    minTokens: previous?.minTokens ?? DEFAULT_SETTINGS.minTokens,
    newMemberCap: previous?.newMemberCap ?? DEFAULT_SETTINGS.newMemberCap,
    members: measured,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const file = join(root, BASELINE_PATH);
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  const baseline = parse(text) ?? {};
  const measured = measureMembers(root, baseline.minTokens ?? DEFAULT_SETTINGS.minTokens);
  if (process.argv.includes("--update")) {
    // Keeps the file's leading comment block (its contract docblock) above the regenerated data.
    const header = text.match(/^(?:#.*\n)*/)?.[0] ?? "";
    writeFileSync(file, header + stringify(baselineDocument(baseline, measured)));
  } else {
    const findings = ratchetFindings(baseline, measured);
    for (const { dir, text: finding } of findings) console.error(`${dir}: ${finding}`);
    if (findings.length) process.exit(1);
  }
}
