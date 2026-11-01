/**
 * Stackra file contract:
 * Purpose: `sessionSettingFindings(root, allowed)`, the session-setting check of `stackra validate --repository`
 *          (STA-1699, ADR 0495 decision 3; moved from `tools/scripts/session-settings.mjs`): `settingProblems` over
 *          every source file, rule 2 lifted for each path of `allowed`, a file under a `src/testing/` folder and a test
 *          file (a `__tests__` folder, or named `*.test.*`); rule 1 has no exemption of any kind.
 * Boundary: reads every `.ts`, `.tsx`, `.js`, `.cjs`, `.mjs`, `.mts`, `.cts` and `.sql` file under `packages/`,
 *           `services/`, `apps/` and `workers/` (`node_modules`, `dist`, `.stackra`, `.turbo`, `coverage`, `.git`
 *           skipped); writes nothing. The scan reads comments and strings alike, so a doc that names a forbidden form
 *           is a finding too: write "a session-level setting" instead.
 * Runtime: node
 * Governing contract: ADR 0495 (decision 3); ADR 0239 (decision 1); ADR 0473 (RDS Proxy); `.agents/rules/tenancy.md`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SESSION_SETTING_ALLOWED } from "#node/session-settings/constants/session-setting-allowed.constant";
import { settingProblems } from "#node/session-settings/functions/setting-problems.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/** The folders scanned, relative to the repository root. */
const SCANNED = ["packages", "services", "apps", "workers"] as const;

/** The source extensions scanned. */
const SOURCE = /\.(?:ts|tsx|js|cjs|mjs|mts|cts|sql)$/;

/** Folders never entered. */
const SKIPPED = new Set(["node_modules", "dist", ".stackra", ".turbo", "coverage", ".git"]);

/** Whether `path` is test infrastructure: under a `src/testing/` folder. */
const isTestingHelper = (path: string): boolean => path.includes("/src/testing/");

/** Whether `path` (repository-relative, `/`-separated) is a test file: in a `__tests__` folder or named `*.test.*`. */
const isTest = (path: string): boolean =>
  path.split("/").includes("__tests__") || /\.test\.[^/]+$/.test(path);

/** Every scannable file under `dir`, as repository-relative paths. */
function sources(root: string, dir: string): string[] {
  const found: string[] = [];
  let entries;
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (SKIPPED.has(entry.name)) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...sources(root, path));
    else if (entry.isFile() && SOURCE.test(entry.name)) found.push(path);
  }
  return found;
}

/**
 * The findings of the repository at `root`: one per forbidden setting, `dir` being the file and line.
 *
 * @param root - the repository root.
 * @param allowed - the allow-listed paths; the shipped list by default.
 * @example
 * sessionSettingFindings(root); // [{ dir: "services/orders/src/x.ts:12", text: "..." }]
 */
export function sessionSettingFindings(
  root: string,
  allowed: Readonly<Record<string, string>> = SESSION_SETTING_ALLOWED,
): DirFinding[] {
  const findings: DirFinding[] = [];
  for (const area of SCANNED)
    for (const path of sources(root, area)) {
      const outsideAllowed = !(isTest(path) || isTestingHelper(path) || Object.hasOwn(allowed, path));
      for (const { line, text } of settingProblems(readFileSync(join(root, path), "utf8"), {
        outsideAllowed,
      }))
        findings.push({ dir: `${path}:${line}`, text });
    }
  return findings;
}
