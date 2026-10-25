/**
 * Stackra file contract:
 * Purpose: `SeedRunner`, what `stackra seed-pack` calls in the member's `@stackra/database/node`: `seedState` lists
 *          the records of a pack it already stores, with their owner and hash, and `applySeed` writes the planned
 *          records as product defaults under the pack version and answers with the `kind:key` it wrote.
 * Boundary: type only. The CLI declares the shape it needs and imports the module from the member at run time, as
 *           it does for `migrate`; the runner never writes the tenant layer.
 * Runtime: node
 * Governing contract: ADR 0325 (decision 7: seeds are resumable and tested); ADR 0190; config-model section 6.
 */
import type { PlannedSeedRecord } from "#node/types/planned-seed-record.type";
import type { SeedState } from "#node/types/seed-state.type";

/** The seed runner of one member. */
export type SeedRunner = {
  /** The records of the pack the store holds. */
  readonly seedState: (options: {
    readonly cwd: string;
    readonly environment: string;
    readonly pack: string;
  }) => Promise<readonly SeedState[]>;

  /** Writes the records as product defaults; resolves with the `kind:key` of each record written. */
  readonly applySeed: (options: {
    readonly cwd: string;
    readonly environment: string;
    readonly pack: string;
    readonly version: string;
    readonly profile: string;
    readonly records: readonly PlannedSeedRecord[];
  }) => Promise<{ readonly written: readonly string[] }>;
};
