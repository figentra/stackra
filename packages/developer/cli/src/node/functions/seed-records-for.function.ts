/**
 * Stackra file contract:
 * Purpose: `seedRecordsFor(pack, profile)`, the records one profile loads, layer by layer (`demo` is `minimal` then
 *          `demo`), in pack order inside a layer.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0190 (decision 1); OS-17 (a sandbox holds live config plus the demo seed).
 */
import { SEED_PROFILES } from "#node/constants/seed-profiles.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { SeedPack } from "#node/types/seed-pack.type";
import type { SeedRecord } from "#node/types/seed-record.type";

/**
 * The records of `profile`.
 *
 * @param pack - the pack.
 * @param profile - `minimal`, `demo` or `test`.
 * @throws CliUsageError on another profile name.
 * @example
 * seedRecordsFor(pack, "demo").map((record) => record.profile); // ["minimal", "minimal", "demo"]
 */
export function seedRecordsFor(pack: SeedPack, profile: string): readonly SeedRecord[] {
  const layers = SEED_PROFILES[profile];
  if (layers === undefined)
    throw new CliUsageError(
      `unknown profile: ${profile} (expected ${Object.keys(SEED_PROFILES).join(", ")})`,
    );
  return layers.flatMap((layer) => pack.records.filter((record) => record.profile === layer));
}
