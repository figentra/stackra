/**
 * Stackra file contract:
 * Purpose: `PruneRecordsAction`, `data_maintenance.record.prune@1`: the nightly system job that runs `pruneAllRecords`
 *          of @stackra/database, so every registered model's expired rows are archived, soft-deleted or deleted, and
 *          soft-deleted rows go for good after 30 days, legal holds honoured.
 * Boundary: a job is an action with a `job` surface: unique per scope, ten minutes at most, dispatched at 03:00 UTC
 *           once per scope, so row-level security shows each run its scope's rows only. The only actor is the system,
 *           so it gets no endpoint and no tool. The per-model counts go to the audit entry. Its permission is
 *           `RecordPermissions.prune`, system-held at L4. Gen registers it with `registerScheduledJobs`.
 * Runtime: node
 * Governing contract: ADR 0134 (decision 3: `@Retention` drives the prune jobs); ADR 0189 (decision 4); ADR 0305
 *                     (rule 28: the job surface); ADR 0148 (queue and scheduler); data-layer gaps gov4 and mo27; ADR
 *                     0462 (decision 1).
 */
import { Action } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { pruneAllRecords } from "@stackra/database";

import type { PruneRecordsInput } from "#node/schemas/prune-records-input.schema";
import { PruneRecordsOutput } from "#node/schemas/prune-records-output.schema";

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
  /** Prunes each registered model with a retention step at the call's instant and audits each that changed. */
  async handle(_input: PruneRecordsInput, ctx: ActionContext): Promise<PruneRecordsOutput> {
    const totals = { expired: 0, purged: 0, held: 0 };
    for (const { model, expired, purged, held } of await pruneAllRecords(ctx.now())) {
      totals.expired += expired;
      totals.purged += purged;
      totals.held += held;
      if (expired + purged + held > 0) ctx.audit({ [model]: { expired, purged, held } });
    }
    return PruneRecordsOutput.create(totals);
  }
}
