/**
 * Stackra file contract:
 * Purpose: `DeleteMyAccountAction`, `identity.account_deletion.request@1`: the in-app account deletion App Store
 *          Review Guideline 5.1.1(v) and Google Play ask for. It schedules the caller's own account for erasure after
 *          `IdentityConfig.accountDeletionGraceDays`, records `AccountDeletionScheduled` and answers the date;
 *          `POST /account-deletion`. `EraseDueAccountsAction` starts the erasure once the grace period ends.
 * Boundary: a signed-in user only, for their own account: the subject is the actor's `usr_` id, never a body field,
 *           and a call made on someone else's behalf (`onBehalfOf`: a guardian, support acting as the user) is
 *           `ForbiddenError`. It needs a fresh step-up (`stepUp: aal2`, `StepUpRequiredError` otherwise, checked by
 *           the pipeline before `handle`). Idempotent: asking again while one is scheduled answers the same date and
 *           records nothing. Not an MCP tool.
 * Runtime: node
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0207 (decision 1: step-up); ADR 0189 (decision 2);
 *                     ADR 0462; ADR 0294 (decisions 16 and 21); STA-1567.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind, AssuranceLevel, mintPublicId } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";

import type { IdentityConfig } from "#config/identity.config";
import type { AccountDeletions } from "#contracts/index";
import { AccountDeletionScheduled } from "#core/events/account-deletion-scheduled.event";
import type { AccountDeletionInput } from "#node/schemas/account-deletion-input.schema";
import { AccountDeletionOutput } from "#node/schemas/account-deletion-output.schema";

/** Milliseconds in a day. */
const DAY = 86_400_000;

/**
 * Schedules the caller's account deletion.
 *
 * @example
 * const { dueAt } = await pipeline.execute(DeleteMyAccountAction, {}, { actor });
 */
export class DeleteMyAccountAction extends Action({
  key: "account_deletion.request",
  actors: [ActorKind.User],
  stepUp: AssuranceLevel.Aal2,
  // reason: deleting an account is the person's own decision, never an agent's
  tool: false,
}) {
  /** Where scheduled deletions wait. */
  private readonly deletions: AccountDeletions;

  /** The grace period, read at call time so an override applies to the next request. */
  private readonly config: IdentityConfig;

  /**
   * @param deletions - where scheduled deletions wait.
   * @param config - the grace period.
   */
  constructor(deletions: AccountDeletions, config: IdentityConfig) {
    super();
    this.deletions = deletions;
    this.config = config;
  }

  /** Schedules the caller's own deletion, or answers the one already scheduled. */
  async handle(_input: AccountDeletionInput, ctx: ActionContext): Promise<AccountDeletionOutput> {
    const { actor } = ctx;
    if (actor.kind !== ActorKind.User || actor.onBehalfOf !== undefined)
      throw ForbiddenError.create();
    const scheduled = await this.deletions.find(actor.id);
    if (scheduled !== undefined) return AccountDeletionOutput.from(scheduled);
    const requestedAt = ctx.now();
    const deletion = {
      subject: actor.id,
      erasureId: mintPublicId("era", requestedAt.getTime()),
      requestedAt,
      dueAt: new Date(requestedAt.getTime() + this.config.accountDeletionGraceDays * DAY),
    };
    await this.deletions.put(deletion);
    await ctx.publish(
      AccountDeletionScheduled.create({ subject: actor.id, dueAt: deletion.dueAt.toISOString() }),
    );
    ctx.audit({ erasureId: deletion.erasureId, dueAt: deletion.dueAt.toISOString() });
    return AccountDeletionOutput.from(deletion);
  }
}
