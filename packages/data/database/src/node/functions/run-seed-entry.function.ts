/**
 * Stackra file contract:
 * Purpose: `runSeedEntry`, what a service's generated seed entry calls once its container is booted and its database
 *          connected: reads `--profile`, `--module`, `--again` and `--ran-by` from the arguments `stackra db seed`
 *          passed, runs `runSeeders` over the seed ledger and prints what ran and what was skipped.
 * Boundary: decides nothing the CLI already checked (the production guard is the CLI's); answers with the exit code, 1
 *           when a seeder failed, after printing its error. Writes to the streams it is given.
 * Runtime: node
 * Governing contract: ADR 0190; ADR 0325 (decision 7); STA-1709.
 */
import { parseArgs } from "node:util";

import type { Container } from "@stackra/container";

import { runSeeders } from "#node/functions/run-seeders.function";
import { seederLedger } from "#node/functions/seeder-ledger.function";
import type { SeedLedger } from "#node/types/seed-ledger.type";
import type { SeederEntry } from "#node/types/seeder-entry.type";

/**
 * Runs the seeders the arguments ask for.
 *
 * @returns the exit code: 0, or 1 when a seeder failed.
 * @example
 * process.exitCode = await runSeedEntry({ container, member: "commerce", seeders: SEEDERS, argv: process.argv.slice(2) });
 */
export async function runSeedEntry(options: {
  readonly container: Pick<Container, "has" | "get">;
  readonly member: string;
  readonly seeders: readonly SeederEntry[];
  readonly argv: readonly string[];
  readonly ledger?: SeedLedger;
  readonly out?: (text: string) => void;
  readonly err?: (text: string) => void;
}): Promise<number> {
  const out = options.out ?? ((text: string) => void process.stdout.write(text));
  const err = options.err ?? ((text: string) => void process.stderr.write(text));
  const { values } = parseArgs({
    args: [...options.argv],
    options: {
      profile: { type: "string", default: "minimal" },
      module: { type: "string" },
      again: { type: "boolean", default: false },
      "ran-by": { type: "string", default: "unknown" },
    },
  });
  try {
    const { ran, skipped } = await runSeeders({
      container: options.container,
      member: options.member,
      seeders: options.seeders,
      profile: values.profile,
      ledger: options.ledger ?? seederLedger(),
      ranBy: values["ran-by"],
      module: values.module,
      again: values.again,
    });
    out(
      `db seed (${values.profile}): ran ${ran.length}, skipped ${skipped.length} unchanged\n` +
        ran.map((key) => `  ran      ${key}\n`).join("") +
        skipped.map((key) => `  skipped  ${key}\n`).join(""),
    );
    return 0;
  } catch (error) {
    err(`db seed (${values.profile}): ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}
