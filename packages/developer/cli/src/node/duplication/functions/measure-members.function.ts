/**
 * Stackra file contract:
 * Purpose: `measureMembers(root, minTokens?, run?)`, every member with a `src/` to its duplicated percentages of
 *          `src` and of its tests, by one jscpd run per part (moved from `tools/scripts/duplication.mjs`).
 * Boundary: reads pnpm-workspace.yaml; runs the jscpd binary of the workspace into a temp folder it removes.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DEFAULT_SETTINGS } from "#node/duplication/constants/default-settings.constant";
import { jscpdArgs } from "#node/duplication/functions/jscpd-args.function";
import { reportTotals } from "#node/duplication/functions/report-totals.function";
import type { JscpdReport } from "#node/duplication/types/jscpd-report.type";
import { readManifestMembers } from "#node/functions/read-workspace-members.function";

/** Runs one jscpd scan and returns its report. */
type JscpdRunner = (
  root: string,
  srcDir: string,
  part: "src" | "tests",
  minTokens: number,
) => JscpdReport;

/** Runs the jscpd binary of `root` on one part of `srcDir` into a temp folder and returns its JSON report. */
const runJscpd: JscpdRunner = (root, srcDir, part, minTokens) => {
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
    return JSON.parse(readFileSync(reportFile, "utf8")) as JscpdReport;
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
};

/**
 * Member folder to `{ src, tests }` duplicated percentages, in folder order.
 * shortcut: one jscpd process per member and part, so cross-member clones are not counted; run jscpd once over the
 * whole tree when the ratchet needs them (FB-9).
 *
 * @param root - the workspace root.
 * @param minTokens - jscpd's `--min-tokens`.
 * @param run - the jscpd runner; tests pass a fake.
 * @example
 * measureMembers(root); // { "packages/data/a": { src: 1.2, tests: 8 } }
 */
export function measureMembers(
  root: string,
  minTokens: number = DEFAULT_SETTINGS.minTokens,
  run: JscpdRunner = runJscpd,
): Record<string, { src: number; tests: number }> {
  const measured: Record<string, { src: number; tests: number }> = {};
  for (const { dir } of readManifestMembers(root)) {
    const srcDir = join(dir, "src");
    if (!existsSync(join(root, srcDir))) continue;
    measured[dir] = {
      src: reportTotals(run(root, srcDir, "src", minTokens)).percentage,
      tests: reportTotals(run(root, srcDir, "tests", minTokens)).percentage,
    };
  }
  return measured;
}
