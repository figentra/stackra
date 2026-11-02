/**
 * Stackra file contract:
 * Purpose: `runRunwaySecrets(argv, io)`, the `runway secrets sync <env> [--dry-run]` command: reads the runways of
 *          the repository and runs `syncSecrets` for `env`.
 * Boundary: parses arguments only; `syncSecrets` reads and writes, in CI only, and prints names only.
 * Runtime: node
 * Governing contract: ADR 0173; runbooks/runway "Secrets and vars sync"; STA-606.
 */
import { parseArgs } from "node:util";

import { readRunways } from "#node/functions/read-runways.function";
import { syncSecrets } from "#node/functions/sync-secrets.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** How to call the command. */
const USAGE = "usage: pnpm runway secrets sync <env> [--dry-run]";

/**
 * Runs `runway secrets …` with `argv` (the words after `secrets`).
 *
 * @throws Error with the usage when the command is not `sync <env>`.
 * @example
 * await runRunwaySecrets(["sync", "staging", "--dry-run"], { root, log: console.log });
 */
export async function runRunwaySecrets(
  argv: readonly string[],
  io: {
    readonly root: string;
    readonly log: (line: string) => void;
    readonly run?: CommandRunner | undefined;
    readonly ci?: boolean | undefined;
  },
): Promise<void> {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: { "dry-run": { type: "boolean" } },
  });
  const [command, environment] = positionals;
  if (command !== "sync" || environment === undefined || positionals.length > 2)
    throw new Error(USAGE);
  await syncSecrets({
    environment,
    runways: readRunways(io.root),
    repository: io.root,
    dryRun: values["dry-run"] === true,
    log: io.log,
    run: io.run,
    ci: io.ci,
  });
}
