/**
 * Stackra file contract:
 * Purpose: `MaintainPartitionsAction`, `data_maintenance.partition.maintain@1`: the daily system job that runs
 *          `maintainAllPartitions` of @stackra/database, so the next partitions of every registered `Partitioned` model
 *          exist before rows arrive and expired ones are dropped whole, legal holds honoured.
 * Boundary: a job is an action with a `job` surface: unique, ten minutes at most, dispatched at 02:15 UTC once (not per
 *           scope: partitions are shared by every scope's rows). The only actor is the system, so it gets no endpoint
 *           and no tool. The partition names go to the audit entry. Its permission is
 *           `PartitionPermissions.maintain`, system-held. Gen registers it with `registerScheduledJobs`.
 * Runtime: node
 * Governing contract: data-layer gaps db12, cdc6, sc4; ADR 0305 (rule 28: the job surface); ADR 0148 (queue and
 *                     scheduler); ADR 0134 (holds); ADR 0462 (decision 1).
 */
import { Action } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { maintainAllPartitions } from "@stackra/database";

import type { MaintainPartitionsInput } from "#node/schemas/maintain-partitions-input.schema";
import { MaintainPartitionsOutput } from "#node/schemas/maintain-partitions-output.schema";

/**
 * Keeps every partitioned table current.
 *
 * @example
 * await pipeline.execute(MaintainPartitionsAction, {}, { actor: systemActor });
 */
export class MaintainPartitionsAction extends Action({
  key: "partition.maintain",
  actors: [ActorKind.System],
  job: {
    unique: true,
    timeout: "10m",
    cron: { schedule: "15 2 * * *" },
  },
}) {
  /** Maintains each registered `Partitioned` model at the call's instant and audits each table. */
  async handle(
    _input: MaintainPartitionsInput,
    ctx: ActionContext,
  ): Promise<MaintainPartitionsOutput> {
    const totals = { created: 0, dropped: 0, held: 0 };
    for (const report of await maintainAllPartitions(ctx.now())) {
      totals.created += report.created.length;
      totals.dropped += report.dropped.length;
      totals.held += report.held.length;
      ctx.audit({
        [report.table]: {
          created: [...report.created],
          dropped: [...report.dropped],
          held: [...report.held],
        },
      });
    }
    return MaintainPartitionsOutput.create(totals);
  }
}
