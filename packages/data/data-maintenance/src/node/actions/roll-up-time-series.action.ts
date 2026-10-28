/**
 * Stackra file contract:
 * Purpose: `RollUpTimeSeriesAction`, `data_maintenance.timeseries.rollup@1`: the system job that runs
 *          `rollUpAllTimeSeries` of @stackra/database, so each registered `TimeSeries`' rollup tables hold their recent
 *          buckets and drop expired ones.
 * Boundary: a job is an action with a `job` surface: unique per scope, ten minutes at most, dispatched every 15 minutes
 *           once per scope, so row-level security shows each run its scope's source rows and rollup rows only. The only
 *           actor is the system, so it gets no endpoint and no tool. The per-table counts go to the audit entry. Its
 *           permission is `TimeseriesPermissions.rollup`, system-held. Gen registers it with `registerScheduledJobs`.
 * Runtime: node
 * Governing contract: data-layer gap cdc7 (stackra-321); ADR 0305 (rule 28: the job surface); ADR 0148 (queue and
 *                     scheduler); ADR 0462 (decision 1).
 */
import { Action } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { rollUpAllTimeSeries } from "@stackra/database";

import type { RollUpTimeSeriesInput } from "#node/schemas/roll-up-time-series-input.schema";
import { RollUpTimeSeriesOutput } from "#node/schemas/roll-up-time-series-output.schema";

/**
 * Keeps every time series' rollups current.
 *
 * @example
 * await pipeline.execute(RollUpTimeSeriesAction, {}, { actor: systemActor });
 */
export class RollUpTimeSeriesAction extends Action({
  key: "timeseries.rollup",
  actors: [ActorKind.System],
  job: {
    unique: true,
    timeout: "10m",
    cron: { schedule: "*/15 * * * *", perScope: true },
  },
}) {
  /** Rolls up each registered series at the call's instant and audits each table. */
  async handle(_input: RollUpTimeSeriesInput, ctx: ActionContext): Promise<RollUpTimeSeriesOutput> {
    const totals = { written: 0, pruned: 0 };
    for (const report of await rollUpAllTimeSeries(ctx.now())) {
      for (const { table, written, pruned } of report.tables) {
        totals.written += written;
        totals.pruned += pruned;
        ctx.audit({ [table]: { written, pruned } });
      }
    }
    return RollUpTimeSeriesOutput.create(totals);
  }
}
