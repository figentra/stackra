/**
 * Stackra file contract:
 * Purpose: `MaintainChangeLogAction`, `data_maintenance.change_log.maintain@1`: the daily system job that runs
 *          `ChangeFeed.maintain` of @stackra/outbox, which keeps the change log's next daily partitions ready and drops
 *          the ones older than `outbox.changeRetentionDays`, whole.
 * Boundary: a job is an action with a `job` surface: unique, five minutes at most, dispatched at 02:30 UTC once (not
 *           per scope: the log is shared by every scope's changes). The only actor is the system, so it gets no
 *           endpoint and no tool. Its permission is `ChangeLogPermissions.maintain`, system-held. Gen registers it
 *           with `registerScheduledJobs`.
 * Runtime: node
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: retention by whole partitions); ADR 0305 (rule 28:
 *                     the job surface); ADR 0148 (queue and scheduler); data-layer gap cdc6; ADR 0462 (decision 1).
 */
import { Action } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind, Duration } from "@stackra/contracts";
import type { OutboxConfig } from "@stackra/outbox";
import type { ChangeFeed } from "@stackra/outbox/contracts";

import type { MaintainChangeLogInput } from "#node/schemas/maintain-change-log-input.schema";
import { MaintainChangeLogOutput } from "#node/schemas/maintain-change-log-output.schema";

/**
 * Keeps the change log's partitions current.
 *
 * @example
 * await pipeline.execute(MaintainChangeLogAction, {}, { actor: systemActor });
 */
export class MaintainChangeLogAction extends Action({
  key: "change_log.maintain",
  actors: [ActorKind.System],
  job: {
    unique: true,
    timeout: "5m",
    cron: { schedule: "30 2 * * *" },
  },
}) {
  /** The change log. */
  private readonly feed: ChangeFeed;

  /** The retention window, read at run time so an override applies on the next tick. */
  private readonly config: OutboxConfig;

  /**
   * @param feed - the change log.
   * @param config - the outbox configuration.
   */
  constructor(feed: ChangeFeed, config: OutboxConfig) {
    super();
    this.feed = feed;
    this.config = config;
  }

  /** Maintains the log at the call's instant. */
  async handle(
    _input: MaintainChangeLogInput,
    ctx: ActionContext,
  ): Promise<MaintainChangeLogOutput> {
    const report = await this.feed.maintain(
      ctx.now(),
      Duration.days(this.config.changeRetentionDays),
    );
    return MaintainChangeLogOutput.create({ ...report });
  }
}
