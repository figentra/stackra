/**
 * Stackra file contract:
 * Purpose: `planSeed(records, state)`, what a seed run does with each record: insert it when the store lacks it,
 *          update it when the store holds the seed's older content, leave it when it is current, and keep it when a
 *          tenant changed it. A new seed version never overwrites a tenant value; it only changes the product default
 *          underneath.
 * Boundary: pure over the records and the runner's stored state.
 * Runtime: node
 * Governing contract: config-model sections 3 and 6; ADR 0325 (decision 7: seeds are resumable).
 */
import { seedRecordHash } from "#node/functions/seed-record-hash.function";
import type { PlannedSeedRecord } from "#node/types/planned-seed-record.type";
import type { SeedPlan } from "#node/types/seed-plan.type";
import type { SeedRecord } from "#node/types/seed-record.type";
import type { SeedState } from "#node/types/seed-state.type";

/**
 * The plan of one seed run.
 *
 * @param records - the records the profile loads.
 * @param state - what the store already holds for the pack.
 * @example
 * planSeed(seedRecordsFor(pack, "minimal"), await runner.seedState({ cwd, environment, pack: pack.key }));
 */
export function planSeed(records: readonly SeedRecord[], state: readonly SeedState[]): SeedPlan {
  const stored = new Map(state.map((item) => [`${item.kind}:${item.key}`, item]));
  const insert: PlannedSeedRecord[] = [];
  const update: PlannedSeedRecord[] = [];
  const unchanged: string[] = [];
  const kept: string[] = [];
  for (const record of records) {
    const id = `${record.kind}:${record.key}`;
    const planned = { ...record, hash: seedRecordHash(record) };
    const current = stored.get(id);
    if (current === undefined) insert.push(planned);
    else if (current.owner === "tenant") kept.push(id);
    else if (current.hash === planned.hash) unchanged.push(id);
    else update.push(planned);
  }
  return { insert, update, unchanged, kept };
}
