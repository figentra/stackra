/**
 * Stackra file contract:
 * Purpose: `pruneAllRecords(now)`, the retention step of every registered model with a `Retention` trait or
 *          `SoftDeletes` in the running scope: runs `pruneRecords` for each in turn and answers one report per model.
 * Boundary: reads the registered entity schemas, which gen's entity files fill; runs on the running context's entity
 *           manager as `pruneRecords` does, so row-level security limits it to the session's scope. The retention job
 *           of @stackra/data-maintenance calls it once per scope and audits the reports; this package declares no job.
 * Runtime: node
 * Governing contract: ADR 0134 (decision 3); ADR 0189 (decision 4); data-layer gaps gov4 and mo27; ADR 0462
 *                     (decision 1: jobs live in an add-on above iam).
 */
import { traitsOf } from "@stackra/model";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { pruneRecords } from "#core/functions/prune-records.function";
import type { PruneReport } from "#core/types/prune-report.type";

/** The traits that give a model a retention step. */
const RETAINED = new Set(["retention", "soft_deletes"]);

/**
 * Applies every model's retention in the running scope.
 *
 * @example
 * const reports = await pruneAllRecords(new Date());
 */
export async function pruneAllRecords(now: Date): Promise<readonly PruneReport[]> {
  const reports: PruneReport[] = [];
  for (const schema of REGISTERED_ENTITIES) {
    const model = schema.meta.class;
    if (traitsOf(model).some((trait) => RETAINED.has(trait.name)))
      reports.push(await pruneRecords(model, now));
  }
  return reports;
}
