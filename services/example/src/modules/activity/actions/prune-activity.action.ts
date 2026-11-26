/**
 * Stackra file contract:
 * Purpose: `PruneActivityAction`, `activity.activity_entry.prune@1`: the daily retention job of the activity feed. It
 *          deletes, in one tenant, the entries that happened more than `keepDays` days ago (90 from the cron).
 * Boundary: a job is an action with a `job` surface. Its only actor is the system, so it gets no endpoint and no tool.
 *           At 03:30 UTC the scheduler pushes one run per tenant (`perScope`) onto the default queue; the queue worker
 *           runs each through the actions pipeline in that tenant's isolation, retried with exponential back-off and
 *           parked in the dead-letter queue when every attempt failed. `unique` keeps a second run of a tenant out
 *           while one waits or runs. The delete is for good, so it declares `irreversible`; the tenant's row policy
 *           limits it to that tenant's entries.
 * Runtime: node
 * Governing contract: ADR 0148 (decisions 4 and 5: queue and per-scope crons); ADR 0305 (rule 28: the job surface);
 *                     ADR 0294 (decisions 16, 18 and 21); ADR 0212 (retention).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { Effect } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";

import type { PruneActivityInput } from "#modules/activity/schemas/prune-activity-input.schema";
import { PruneActivityOutput } from "#modules/activity/schemas/prune-activity-output.schema";
import type { ActivityEntryService } from "#modules/activity/services/activity-entry.service";

/** One day, in milliseconds. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deletes the running tenant's feed entries past their retention.
 *
 * @example
 * // queued by the scheduler; by hand: ctx.dispatch(PruneActivityAction, { keepDays: 30 })
 */
export class PruneActivityAction extends Action({
  key: "activity_entry.prune",
  actors: [ActorKind.System],
  effects: [Effect.Irreversible],
  job: {
    unique: true,
    retries: 3,
    backoff: Backoff.Exponential,
    timeout: "5m",
    deadLetter: true,
    cron: {
      schedule: "30 3 * * *",
      perScope: true,
      input: { keepDays: 90 },
    },
  },
}) {
  private readonly entries: ActivityEntryService;

  /**
   * @param entries - deletes the rows.
   */
  constructor(entries: ActivityEntryService) {
    super();
    this.entries = entries;
  }

  /** Deletes every entry that happened before `now - keepDays` and answers how many went. */
  async handle(input: PruneActivityInput, ctx: ActionContext): Promise<PruneActivityOutput> {
    const cutoff = new Date(ctx.now().getTime() - input.keepDays * DAY_MS);
    const deleted = await this.entries.prune(cutoff);
    ctx.audit({ keepDays: input.keepDays, deleted });
    return PruneActivityOutput.create({ deleted });
  }
}
