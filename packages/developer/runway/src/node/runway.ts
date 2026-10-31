#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `runway` binary (package.json `bin`, built to `dist/runway.mjs`; `pnpm runway` is its alias): runs
 *          `runRunway` in the repository the working directory is in, with the real git and gh, and prints
 *          `runway: <reason>` and exits 1 on an error.
 * Boundary: the only file with a side effect on import; nothing imports it. git runs in the repository root; gh
 *           inherits the terminal and uses the person's own login.
 * Runtime: node
 * Governing contract: ADR 0170; STA-268.
 */
import { execFileSync } from "node:child_process";

import { repositoryRoot } from "#node/functions/repository-root.function";
import { runRunway } from "#node/functions/run-runway.function";

try {
  const root = repositoryRoot();
  runRunway(process.argv.slice(2), {
    root,
    git: (args) =>
      execFileSync("git", [...args], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
    gh: (args) => execFileSync("gh", [...args], { stdio: "inherit" }),
    log: (line) => process.stdout.write(`${line}\n`),
  });
} catch (error) {
  process.stderr.write(`runway: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
