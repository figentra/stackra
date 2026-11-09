/**
 * Stackra file contract:
 * Purpose: `MaintainChangeLogAction`, `data_maintenance.change_log.maintain@1`: the daily system job that runs
 *          `maintainChangeLog` of @stackra/outbox, which keeps the change log's next daily partitions ready, drops the
 *          ones older than `outbox.changeRetentionDays` whole, and deletes the expired default-partition rows per
 *          tenant.
 * Boundary: a job is an action with a `job` surface: unique, five minutes at most, dispatched at 02:30 UTC once (not
 *           per scope: the log is shared by every scope's changes). The only actor is the system, so it gets no
 *           endpoint and no tool. Its permission is `ChangeLogPermissions.maintain`, system-held. Gen registers it
 *           with `registerScheduledJobs`. The log is tenant-owned: the expired rows of every tenant are claimed and
 *           each tenant's deleted in its own isolation, the `CallIsolation` read optionally from the injected
 *           `Container` (`boundIsolation`), so an app without tenancy still boots.
 * Runtime: node
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: retention by whole partitions); ADR 0305 (rule 28:
 *                     the job surface); ADR 0148 (queue and scheduler); data-layer gap cdc6; ADR 0462 (decision 1); ADR
 *                     0239 (2026-11-07 amendment, gap A).
 */
import { Action, boundIsolation } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import type { Container } from "@stackra/container";
import { ActorKind, Duration } from "@stackra/contracts";
import { maintainChangeLog } from "@stackra/outbox";
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

  /** The container the bound `CallIsolation`, if any, is read from at run time. */
  private readonly container: Container;

  /**
   * @param feed - the change log.
   * @param config - the outbox configuration.
   * @param container - the container whose `CallIsolation` each tenant's expired rows are deleted in.
   */
  constructor(feed: ChangeFeed, config: OutboxConfig, container: Container) {
    super();
    this.feed = feed;
    this.config = config;
    this.container = container;
  }

  /** Maintains the log at the call's instant. */
  async handle(
    _input: MaintainChangeLogInput,
    ctx: ActionContext,
  ): Promise<MaintainChangeLogOutput> {
    const report = await maintainChangeLog(
      this.feed,
      ctx.now(),
      Duration.days(this.config.changeRetentionDays),
      boundIsolation(this.container),
    );
    return MaintainChangeLogOutput.create({ ...report });
  }
}
