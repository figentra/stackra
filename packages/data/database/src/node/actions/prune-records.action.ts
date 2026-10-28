/**
 * Stackra file contract:
 * Purpose: `PruneRecordsAction`, `record.prune@1`: the nightly system job that runs `pruneRecords` for every registered
 *          model with a `Retention` trait or `SoftDeletes`, so expired rows are archived, soft-deleted or deleted, and
 *          soft-deleted rows go for good after 30 days, legal holds honoured.
 * Boundary: a job is an action with a `job` surface: unique per scope, ten minutes at most, dispatched at 03:00 UTC
 *           once per scope, so row-level security shows each run its scope's rows only. The only actor is the system,
 *           so it gets no endpoint and no tool. The per-model counts go to the audit entry. Gen registers it with
 *           `registerScheduledJobs`.
 * Runtime: node
 * Governing contract: ADR 0134 (decision 3: `@Retention` drives the prune jobs); ADR 0189 (decision 4); ADR 0305
 *                     (rule 28: the job surface); ADR 0148 (queue and scheduler); data-layer gaps gov4 and mo27.
 */
import { Action } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { traitsOf } from "@stackra/model";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { pruneRecords } from "#core/functions/prune-records.function";
import type { PruneRecordsInput } from "#node/schemas/prune-records-input.schema";
import { PruneRecordsOutput } from "#node/schemas/prune-records-output.schema";

/** The traits that give a model a retention step. */
const RETAINED = new Set(["retention", "soft_deletes"]);

/**
 * Applies every model's retention in the run's scope.
 *
 * @example
 * await pipeline.execute(PruneRecordsAction, {}, { actor: systemActor });
 */
export class PruneRecordsAction extends Action({
  key: "record.prune",
  actors: [ActorKind.System],
  job: {
    unique: true,
    timeout: "10m",
    cron: { schedule: "0 3 * * *", perScope: true },
  },
}) {
  /** Prunes each registered model with a retention step at the call's instant. */
  async handle(_input: PruneRecordsInput, ctx: ActionContext): Promise<PruneRecordsOutput> {
    const models = [...REGISTERED_ENTITIES]
      .map((schema) => schema.meta.class)
      .filter((model) => traitsOf(model).some((trait) => RETAINED.has(trait.name)));
    const totals = { expired: 0, purged: 0, held: 0 };
    for (const model of models) {
      const report = await pruneRecords(model, ctx.now());
      totals.expired += report.expired;
      totals.purged += report.purged;
      totals.held += report.held;
      if (report.expired + report.purged + report.held > 0)
        ctx.audit({
          [report.model]: { expired: report.expired, purged: report.purged, held: report.held },
        });
    }
    return PruneRecordsOutput.create(totals);
  }
}
