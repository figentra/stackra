/**
 * Stackra file contract:
 * Purpose: `runwayIo(root, log)`, what `runRunway` runs with in the `runway` binary: the real git (in the repository
 *          root, its output read) and gh (inheriting the terminal, so it uses the person's own login).
 * Boundary: starts `git` and `gh` only; a test passes its own io to `runRunway` instead.
 * Runtime: node
 * Governing contract: ADR 0170; ADR 0506 (decision 8: every CLI on @stackra/console); STA-2100.
 */
import { execFileSync } from "node:child_process";

import type { runRunway } from "#node/functions/run-runway.function";

/**
 * The binary's git, gh and log for `runRunway`.
 *
 * @param root - the repository root.
 * @param log - where each line goes.
 * @example
 * runRunway(["plan"], runwayIo(root, (line) => io.output.line(line)));
 */
export function runwayIo(
  root: string,
  log: (line: string) => void,
): Parameters<typeof runRunway>[1] {
  return {
    root,
    git: (args) =>
      execFileSync("git", [...args], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
    gh: (args) => {
      execFileSync("gh", [...args], { stdio: "inherit" });
    },
    log,
  };
}
