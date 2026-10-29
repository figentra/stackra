/**
 * Stackra file contract:
 * Purpose: `ShowAccountDeletionQuery`, `identity.account_deletion.read@1`: the caller's scheduled account deletion
 *          (when it was asked and when it happens), or the empty state, so a settings screen shows the date and a
 *          cancel button; `GET /account-deletion`.
 * Boundary: read only; a signed-in user's own deletion only (the actor's `usr_` id), never another account's. Not an
 *           MCP tool.
 * Runtime: node
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0462; ADR 0294 (decisions 16 and 21); STA-1567.
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import type { AccountDeletions } from "#contracts/index";
import type { AccountDeletionInput } from "#node/schemas/account-deletion-input.schema";
import { AccountDeletionOutput } from "#node/schemas/account-deletion-output.schema";

/**
 * Shows the caller's account deletion.
 *
 * @example
 * const { dueAt } = await pipeline.execute(ShowAccountDeletionQuery, {}, { actor });
 */
export class ShowAccountDeletionQuery extends Query({
  key: "account_deletion.read",
  actors: [ActorKind.User],
  // reason: the account owner's own settings, never an agent's
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

  /** The caller's scheduled deletion, or the empty state. */
  async handle(_input: AccountDeletionInput, ctx: QueryContext): Promise<AccountDeletionOutput> {
    const { actor } = ctx;
    if (actor.kind !== ActorKind.User) return AccountDeletionOutput.from(undefined);
    return AccountDeletionOutput.from(await this.deletions.find(actor.id));
  }
}
