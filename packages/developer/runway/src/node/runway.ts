#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the `runway` binary (package.json `bin`, built to `dist/runway.mjs`; `pnpm runway` is its alias): runs
 *          `runRunway` (`plan`, `deploy`, `promote`) or `runRunwaySecrets` (`secrets sync`) in the repository the
 *          working directory is in, with the real git, gh and command runner, and prints `runway: <reason>` and exits 1
 *          on an error.
 * Boundary: the only file with a side effect on import; nothing imports it. git runs in the repository root; gh
 *           inherits the terminal and uses the person's own login; the secret sync writes only in CI and prints names
 *           only.
 * Runtime: node
 * Governing contract: ADR 0170; ADR 0173; STA-268; STA-606.
 */
import { execFileSync } from "node:child_process";

import { repositoryRoot } from "#node/functions/repository-root.function";
import { runRunway } from "#node/functions/run-runway.function";
import { runRunwaySecrets } from "#node/functions/run-runway-secrets.function";

const log = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

try {
  const root = repositoryRoot();
  const [command, ...rest] = process.argv.slice(2);
  if (command === "secrets") await runRunwaySecrets(rest, { root, log });
  else
    runRunway(process.argv.slice(2), {
      root,
      git: (args) =>
        execFileSync("git", [...args], {
          cwd: root,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }).trim(),
      gh: (args) => execFileSync("gh", [...args], { stdio: "inherit" }),
      log,
    });
} catch (error) {
  process.stderr.write(`runway: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
