/**
 * Stackra file contract:
 * Purpose: `PruneOutboxAction`, `data_maintenance.outbox_message.prune@1`: the daily system job that runs `pruneOutbox`
 *          of @stackra/outbox, which deletes dead-lettered messages and received event ids of the inbox older than
 *          `outbox.pruneAfterDays`, so neither table grows without bound.
 * Boundary: a job is an action with a `job` surface: unique, five minutes at most, dispatched at 03:15 UTC once (not
 *           per scope: both tables are the service's, read across scopes). The only actor is the system, so it gets no
 *           endpoint and no tool. The change log has its own job (`data_maintenance.change_log.maintain`). Its
 *           permission is `OutboxMessagePermissions.prune`, system-held at L4. Gen registers it with
 *           `registerScheduledJobs`. The tables are tenant-owned: `pruneOutbox` claims the dead letters of every
 *           tenant and deletes each in its own tenant's isolation, the `CallIsolation` read optionally from the
 *           injected `Container` (`boundIsolation`), so an app without tenancy still boots and prunes its platform
 *           rows.
 * Runtime: node
 * Governing contract: data-layer gap gov6 (the outbox prune); ADR 0078 (decision 4); ADR 0189 (decision 4: data is
 *                     kept no longer than needed); ADR 0305 (rule 28: the job surface); ADR 0462 (decision 1); ADR
 *                     0239 (2026-11-07 amendment, gap A).
 */
import { Action, boundIsolation } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import type { Container } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { pruneOutbox } from "@stackra/outbox";
import type { OutboxConfig } from "@stackra/outbox";
import type { InboxDriver, OutboxDriver } from "@stackra/outbox/contracts";

import type { PruneOutboxInput } from "#node/schemas/prune-outbox-input.schema";
import { PruneOutboxOutput } from "#node/schemas/prune-outbox-output.schema";

/**
 * Prunes old dead letters and inbox ids.
 *
 * @example
 * await pipeline.execute(PruneOutboxAction, {}, { actor: systemActor });
 */
export class PruneOutboxAction extends Action({
  key: "outbox_message.prune",
  actors: [ActorKind.System],
  job: {
    unique: true,
    timeout: "5m",
    cron: { schedule: "15 3 * * *" },
  },
}) {
  /** The message store. */
  private readonly outbox: OutboxDriver;

  /** The received event ids. */
  private readonly inbox: InboxDriver;

  /** The prune window, read at run time so an override applies on the next tick. */
  private readonly config: OutboxConfig;

  /** The container the bound `CallIsolation`, if any, is read from at run time. */
  private readonly container: Container;

  /**
   * @param outbox - the message store.
   * @param inbox - the received event ids.
   * @param config - the outbox configuration.
   * @param container - the container whose `CallIsolation` each tenant's dead letters are deleted in.
   */
  constructor(
    outbox: OutboxDriver,
    inbox: InboxDriver,
    config: OutboxConfig,
    container: Container,
  ) {
    super();
    this.outbox = outbox;
    this.inbox = inbox;
    this.config = config;
    this.container = container;
  }

  /** Deletes what is older than `pruneAfterDays` before the call's instant. */
  async handle(_input: PruneOutboxInput, ctx: ActionContext): Promise<PruneOutboxOutput> {
    const report = await pruneOutbox(
      this.outbox,
      this.inbox,
      this.config.pruneAfterDays,
      ctx.now(),
      boundIsolation(this.container),
    );
    return PruneOutboxOutput.create(report);
  }
}
