/**
 * Stackra file contract:
 * Purpose: `PruneOutboxAction`, `outbox_message.prune@1`: the daily system job that deletes dead-lettered messages and
 *          received event ids of the inbox older than `outbox.pruneAfterDays`, so neither table grows without bound.
 * Boundary: a job is an action with a `job` surface: unique, five minutes at most, dispatched at 03:15 UTC once (not
 *           per scope: both tables are the service's, read across scopes). The only actor is the system, so it gets no
 *           endpoint and no tool. Live messages are never pruned: a delivered one is already deleted, a due one waits.
 *           The change log has its own retention (`change_log.maintain`). Gen registers it with `registerScheduledJobs`.
 * Runtime: node
 * Governing contract: data-layer gap gov6 (the outbox prune); ADR 0078 (decision 4); ADR 0189 (decision 4: data is
 *                     kept no longer than needed); ADR 0305 (rule 28: the job surface).
 */
import { Action } from "@stackra/actions";
import type { ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import type { OutboxConfig } from "#config/outbox.config";
import type { InboxDriver, OutboxDriver } from "#contracts/index";
import type { PruneOutboxInput } from "#node/schemas/prune-outbox-input.schema";
import { PruneOutboxOutput } from "#node/schemas/prune-outbox-output.schema";

/** One day in milliseconds. */
const DAY = 86_400_000;

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

  /**
   * @param outbox - the message store.
   * @param inbox - the received event ids.
   * @param config - the outbox configuration.
   */
  constructor(outbox: OutboxDriver, inbox: InboxDriver, config: OutboxConfig) {
    super();
    this.outbox = outbox;
    this.inbox = inbox;
    this.config = config;
  }

  /** Deletes what is older than `pruneAfterDays` before the call's instant. */
  async handle(_input: PruneOutboxInput, ctx: ActionContext): Promise<PruneOutboxOutput> {
    const cutoff = new Date(ctx.now().getTime() - this.config.pruneAfterDays * DAY);
    const dead = await this.outbox.pruneDead(cutoff);
    await this.inbox.prune(cutoff);
    return PruneOutboxOutput.create({ dead });
  }
}
