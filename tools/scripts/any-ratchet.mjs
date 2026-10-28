#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `any` ratchet of `pnpm validate` (rule-gap N-5, stackra-229): `typescript/no-explicit-any` is already an
 *          error, so the only way `any` grows is a disable comment. This counts the `oxlint-disable` and
 *          `eslint-disable` comments that name `no-explicit-any`, per package, and fails when a package has more than
 *          its committed baseline (`any-ratchet.baseline.yaml`; a package not listed has a baseline of 0). A package
 *          below its baseline is a printed note, so the baseline can be lowered in the same change.
 * Boundary: reads pnpm-workspace.yaml, the baseline and the source files (`.ts`, `.tsx`, `.mts`, `.cts`, `.js`,
 *           `.mjs`, `.cjs`; `node_modules`, `dist`, `coverage` and `.turbo` skipped) of every member under `packages/`;
 *           writes nothing. Run directly it prints the findings and exits 1, or prints only notes and exits 0.
 * Runtime: node
 * Governing contract: rule-gap list N-5 (owner D11, 2026-10-28); STA-1388; ADR 0129.
 * Scope: every member the `packages` globs of pnpm-workspace.yaml match, under `packages/`.
 * Owner: release-operations · Secrets: forbidden
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

import { readWorkspaceMembers } from "./package-cycles.mjs";

/** A disable directive that names `no-explicit-any` (any plugin prefix), up to the end of its line. */
const ANY_DISABLE = /(?:oxlint|eslint)-disable(?:-next-line|-line)?\s[^\n]*no-explicit-any/g;

/** The committed baseline: package directory to its allowed count. */
export const BASELINE_FILE = "tools/scripts/any-ratchet.baseline.yaml";

/** Every source file under `dir`, skipping dependencies and build output. */
function sourceFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return ["node_modules", "dist", "coverage", ".turbo"].includes(entry.name)
        ? []
        : sourceFiles(path);
    return /\.(?:[cm]?ts|tsx|[cm]?js)$/.test(entry.name) ? [path] : [];
  });
}

/**
 * The `no-explicit-any` disable count of each package that has one: package directory to count, sorted.
 *
 * @example
 * anyDisableCounts(root).get("packages/data/model"); // 1
 */
export function anyDisableCounts(root) {
  const counts = new Map();
  for (const { dir } of readWorkspaceMembers(root)) {
    if (!dir.startsWith("packages/")) continue;
    let count = 0;
    for (const path of sourceFiles(join(root, dir)))
      count += readFileSync(path, "utf8").match(ANY_DISABLE)?.length ?? 0;
    if (count > 0) counts.set(dir, count);
  }
  return new Map([...counts].toSorted(([a], [b]) => (a < b ? -1 : 1)));
}

/** The committed baseline of `root`, or none when the file is missing. */
export function readBaseline(root) {
  const path = join(root, BASELINE_FILE);
  return existsSync(path) ? (parse(readFileSync(path, "utf8")) ?? {}) : {};
}

/**
 * The validate findings (`{ dir, text }`): one per package above its baseline. `baseline` defaults to the committed
 * file; tests pass their own.
 */
export function anyRatchetFindings(root, baseline = readBaseline(root)) {
  return [...anyDisableCounts(root)]
    .filter(([dir, count]) => count > (baseline[dir] ?? 0))
    .map(([dir, count]) => ({
      dir,
      text:
        `${count} \`no-explicit-any\` disable comments, above the baseline of ${baseline[dir] ?? 0} in ` +
        `${BASELINE_FILE}: type the value (unknown, a generic or a named type) instead of adding a disable`,
    }));
}

/** Packages below their baseline, as `dir: count < baseline`, so the baseline can only shrink. */
export function loweredBaselines(root, baseline = readBaseline(root)) {
  const counts = anyDisableCounts(root);
  return Object.entries(baseline)
    .filter(([dir, allowed]) => (counts.get(dir) ?? 0) < allowed)
    .map(([dir, allowed]) => `${dir}: ${counts.get(dir) ?? 0} < ${allowed}`)
    .toSorted();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const findings = anyRatchetFindings(root);
  for (const { dir, text } of findings) console.error(`${dir}: ${text}`);
  const lowered = loweredBaselines(root);
  if (lowered.length) console.error(`note: lower these in ${BASELINE_FILE}: ${lowered.join(", ")}`);
  if (findings.length) process.exit(1);
}
