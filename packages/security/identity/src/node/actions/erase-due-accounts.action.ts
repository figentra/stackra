/**
 * Stackra file contract:
 * Purpose: `EraseDueAccountsAction`, `identity.account_deletion.erase@1`: the job that ends the grace period of every
 *          due account deletion: unless a legal hold names the subject, it queues @stackra/privacy's
 *          `EraseSubjectAction` (the erasure saga) under the deletion's erasure id, removes the deletion and records
 *          `AccountDeletionStarted`. The saga's `SubjectErased` then reaches `EndErasedSubjectSessionsListener`, which
 *          ends the provider sessions and removes the provider user, so the provider user goes only after the
 *          erasure has run.
 * Boundary: a system job, unique, ten minutes at most, hourly, once per scope (`perScope`): the deletions, the hold
 *           check and the erasure it queues all act in that scope's partition, never across tenants (tenancy rule 5).
 *           It never calls the identity provider itself: removing the provider user first would leave personal data
 *           behind a deleted login. A held subject is deferred, not dropped: its deletion is pushed back a day (logged
 *           by erasure id only), so held ones leave the oldest-due batch and never starve the rest, and a later run
 *           asks again. Idempotent: a started deletion is removed in the same unit of work as the queued erasure, and
 *           `EraseSubjectAction` is unique on its input.
 * Runtime: node
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0189 (decisions 2 and 4); ADR 0134 (legal holds);
 *                     ADR 0305 (rule 28: the job surface); ADR 0148 (queue and scheduler); STA-1567; STA-1543.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind, type Logger } from "@stackra/contracts";
import type { SubjectHolds } from "@stackra/privacy/contracts";
import { EraseSubjectAction } from "@stackra/privacy/node";

import type { AccountDeletions } from "#contracts/index";
import { AccountDeletionStarted } from "#core/events/account-deletion-started.event";
import type { AccountDeletionInput } from "#node/schemas/account-deletion-input.schema";
import { EraseDueAccountsOutput } from "#node/schemas/erase-due-accounts-output.schema";

/** Due deletions one run handles. */
const BATCH = 100;

/** How long a held deletion waits before it is asked about again: a day. */
const RECHECK = 86_400_000;

/**
 * Starts the erasure of every account whose grace period ended.
 *
 * @example
 * const { started, held } = await pipeline.execute(EraseDueAccountsAction, {}, { actor: systemActor });
 */
export class EraseDueAccountsAction extends Action({
  key: "account_deletion.erase",
  actors: [ActorKind.System],
  job: { unique: true, timeout: "10m", cron: { schedule: "20 * * * *", perScope: true } },
}) {
  /** Where scheduled deletions wait. */
  private readonly deletions: AccountDeletions;

  /** Whether a legal hold names a subject. */
  private readonly holds: SubjectHolds;

  /** Where a deferred deletion is reported. */
  private readonly logger: Logger;

  /**
   * @param deletions - where scheduled deletions wait.
   * @param holds - whether a legal hold names a subject.
   * @param logger - where a deferred deletion is reported.
   */
  constructor(deletions: AccountDeletions, holds: SubjectHolds, logger: Logger) {
    super();
    this.deletions = deletions;
    this.holds = holds;
    this.logger = logger;
  }

  /** Queues the erasure of each due, unheld deletion. */
  async handle(_input: AccountDeletionInput, ctx: ActionContext): Promise<EraseDueAccountsOutput> {
    let started = 0;
    let held = 0;
    const now = ctx.now();
    for (const deletion of await this.deletions.due(now, BATCH)) {
      const { subject, erasureId } = deletion;
      if (await this.holds.isHeld(subject)) {
        held += 1;
        await this.deletions.put({ ...deletion, dueAt: new Date(now.getTime() + RECHECK) });
        this.logger.warn("identity.account_deletion.held", { erasureId });
        continue;
      }
      await ctx.dispatch(EraseSubjectAction, { erasureId, subject });
      await this.deletions.remove(subject);
      await ctx.publish(AccountDeletionStarted.create({ subject, erasureId }));
      started += 1;
    }
    return EraseDueAccountsOutput.create({ started, held });
  }
}
