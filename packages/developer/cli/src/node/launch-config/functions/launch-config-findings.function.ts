/**
 * Stackra file contract:
 * Purpose: `launchConfigFindings(root)`, the launch file check of `stackra validate --repository`: one finding per
 *          file that differs from what `stackra gen` writes from the runways (`.claude/launch.json`, the `dev: …` tasks
 *          of `.vscode/tasks.json`: a hand edit or a runway change without gen), and one per port two servers share.
 * Boundary: reads the runways and the committed file; writes nothing. A repository without a root runway has no
 *           launch file to check.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5, amendment of 2026-11-03); ADR 0296 (decision 1); STA-2081.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { LAUNCH_FILE } from "#node/launch-config/constants/launch-file.constant";
import { readLaunchInputs } from "#node/launch-config/functions/read-launch-inputs.function";
import { renderLaunchConfig } from "#node/launch-config/functions/render-launch-config.function";
import { writeLaunchFiles } from "#node/launch-config/functions/write-launch-files.function";
import type { DirFinding } from "#node/types/dir-finding.type";

/**
 * The launch file findings of the repository at `root`.
 *
 * @example
 * launchConfigFindings(root); // [] when the committed file is what gen writes
 */
export function launchConfigFindings(root: string): DirFinding[] {
  if (!existsSync(join(root, "runway.yaml"))) return [];
  const out: DirFinding[] = [];
  for (const { file, status } of writeLaunchFiles(root, true))
    if (status === "stale")
      out.push({
        dir: file,
        text: "is not what `stackra gen` writes from the runways: run `pnpm gen:workspace` and commit it (a hand edit is overwritten; change the runway instead)",
      });
  const owners = new Map<number, string>();
  for (const { name, port } of renderLaunchConfig(readLaunchInputs(root)).configurations) {
    const owner = owners.get(port);
    if (owner === undefined) owners.set(port, name);
    else
      out.push({
        dir: LAUNCH_FILE,
        text: `${owner} and ${name} both listen on port ${port}: give one another dev port in its runway`,
      });
  }
  return out;
}
