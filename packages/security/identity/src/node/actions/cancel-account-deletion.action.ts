/**
 * Stackra file contract:
 * Purpose: `CancelAccountDeletionAction`, `identity.account_deletion.cancel@1`: keeps the caller's account by removing
 *          its scheduled deletion within the grace period, records `AccountDeletionCancelled` and answers the empty
 *          state; `DELETE /account-deletion`.
 * Boundary: a signed-in user only, for their own account (the actor's `usr_` id; a call on someone else's behalf is
 *           `ForbiddenError`). No step-up: keeping an account takes nothing away. Idempotent: with nothing scheduled
 *           (never asked, already cancelled, or the erasure already started) it answers the empty state and records
 *           nothing. Not an MCP tool.
 * Runtime: node
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0462; ADR 0294 (decisions 16 and 21); STA-1567.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";

import type { AccountDeletions } from "#contracts/index";
import { AccountDeletionCancelled } from "#core/events/account-deletion-cancelled.event";
import type { AccountDeletionInput } from "#node/schemas/account-deletion-input.schema";
import { AccountDeletionOutput } from "#node/schemas/account-deletion-output.schema";

/**
 * Cancels the caller's account deletion.
 *
 * @example
 * await pipeline.execute(CancelAccountDeletionAction, {}, { actor });
 */
export class CancelAccountDeletionAction extends Action({
  key: "account_deletion.cancel",
  actors: [ActorKind.User],
  // reason: the account owner's own decision, never an agent's
  tool: false,
}) {
  /** Where scheduled deletions wait. */
  private readonly deletions: AccountDeletions;

  /**
   * @param deletions - where scheduled deletions wait.
   */
  constructor(deletions: AccountDeletions) {
    super();
    this.deletions = deletions;
  }

  /** Removes the caller's scheduled deletion, if any. */
  async handle(_input: AccountDeletionInput, ctx: ActionContext): Promise<AccountDeletionOutput> {
    const { actor } = ctx;
    if (actor.kind !== ActorKind.User || actor.onBehalfOf !== undefined)
      throw ForbiddenError.create();
    if (await this.deletions.remove(actor.id))
      await ctx.publish(
        AccountDeletionCancelled.create({ subject: actor.id, at: ctx.now().toISOString() }),
      );
    return AccountDeletionOutput.from(undefined);
  }
}
