/**
 * Stackra file contract:
 * Purpose: `runRunwayDrift(argv, io)`, the `runway drift [env]` command: for every `cloudflare-workers` target of
 *          `env` (default production) that lists Worker members, prints each member's settings that differ between
 *          runway.yaml's rendered config and what Cloudflare reports, and returns how many Workers drifted.
 * Boundary: read-only; the one network call is a GET with `CLOUDFLARE_API_TOKEN_READ` (never a write, ADR 0519
 *           decision 7). Prints names and setting values, never a secret. The caller sets the exit code.
 * Runtime: node
 * Governing contract: ADR 0519 (decision 7); ADR 0352 (decision 1); STA-1992.
 */
import { join } from "node:path";
import { parseArgs } from "node:util";

import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { deployTargets } from "#core/functions/deploy-targets.function";
import { CloudflareWorkersProviderDriver } from "#node/drivers/cloudflare-workers-provider.driver";
import { readRunway } from "#node/functions/read-runway.function";

/** How to call the command. */
const USAGE = "usage: pnpm runway drift [env]";

/**
 * Runs `runway drift …` with `argv` (the words after `drift`).
 *
 * @returns the number of Workers that drifted.
 * @throws Error with the usage on extra words.
 * @example
 * const drifted = await runRunwayDrift([], { root, log: console.log }); // 0 when nothing drifted
 */
export async function runRunwayDrift(
  argv: readonly string[],
  io: {
    readonly root: string;
    readonly log: (line: string) => void;
    readonly provider?: CloudflareWorkersProviderDriver | undefined;
  },
): Promise<number> {
  const { positionals } = parseArgs({ args: [...argv], allowPositionals: true });
  if (positionals.length > 1) throw new Error(USAGE);
  const environment = positionals[0] ?? "production";
  const provider = io.provider ?? new CloudflareWorkersProviderDriver();
  provider.root = io.root;
  let drifted = 0;
  const seen = new Set<string>();
  for (const target of deployTargets(
    readRunway(join(io.root, "runway.yaml"), "root"),
    environment as RunwayEnvironment,
  )) {
    // The same members repeat per kind and region; a Worker is read once.
    if (target.destination !== "cloudflare-workers" || !("members" in target.settings)) continue;
    for (const { member, worker, rows } of await provider.drift(target)) {
      if (seen.has(worker)) continue;
      seen.add(worker);
      if (rows.length === 0) io.log(`ok ${member} (${worker})`);
      else {
        drifted += 1;
        io.log(`drift ${member} (${worker})`);
        for (const row of rows)
          io.log(`  ${row.key}: runway.yaml ${row.rendered}, Cloudflare ${row.live}`);
      }
    }
  }
  io.log(`${seen.size} Workers read, ${drifted} drifted`);
  return drifted;
}
