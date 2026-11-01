/**
 * Stackra file contract:
 * Purpose: `createConsumerGateDeps()`, the real `ConsumerGateDeps`: `exec` starts a program without a shell with its
 *          output in the step's log file, and `head` reads `git rev-parse HEAD`.
 * Boundary: starts `pnpm`, `turbo` (through pnpm), `sh` and `git`; passes the caller's environment through untouched
 *           (tokens come from Infisical on the box) and never reads, prints or logs a value from it.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0484; STA-1813.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { closeSync, openSync } from "node:fs";

import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";

/**
 * Builds the real runner.
 *
 * @example
 * const deps = createConsumerGateDeps();
 */
export function createConsumerGateDeps(): ConsumerGateDeps {
  return {
    exec: (argv, { cwd, logFile }) => {
      const fd = openSync(logFile, "w");
      try {
        const run = spawnSync(argv[0] as string, argv.slice(1), {
          cwd,
          stdio: ["ignore", fd, fd],
          env: { ...process.env, CI: "1", TURBO_TELEMETRY_DISABLED: "1" },
        });
        return run.status ?? 1;
      } finally {
        closeSync(fd);
      }
    },
    head: (dir) => {
      try {
        return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
      } catch {
        return undefined;
      }
    },
  };
}
