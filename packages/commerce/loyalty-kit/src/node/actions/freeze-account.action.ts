/**
 * Stackra file contract:
 * Purpose: `FreezeAccountAction`, `loyalty_kit.account.freeze@1`: freeze or unfreeze an account for review.
 * Boundary: single aggregate, inline. Its permission is `LoyaltyAccountPermissions.freeze` (L2, so the panel asks a
 *           person to confirm and an agent calls the tool only with approval); `LoyaltyAccountPolicy#freeze` refines it
 *           through `ctx.authorize(account)`. The sample's path is kept, so `endpoint` is written. The confirmation and
 *           success texts are the derived keys `loyalty_kit::actions.account.freeze.confirm` and `.success`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 3, 16 and 21); ADR 0305 (rule 28); ADR 0098; ADR 0099 (risk).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind, HttpMethod } from "@stackra/contracts";

import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import type { FreezeAccountInput } from "#node/schemas/freeze-account-input.schema";
import { FreezeAccountOutput } from "#node/schemas/freeze-account-output.schema";
import type { AccountService } from "#node/services/account.service";

/**
 * Idempotent (PUT): freezing a frozen account changes nothing and records nothing.
 *
 * @example
 * await pipeline.execute(FreezeAccountAction, { accountId, isFrozen: true }, { actor });
 */
export class FreezeAccountAction extends Action({
  key: "account.freeze",
  permission: LoyaltyAccountPermissions.freeze,
  actors: [ActorKind.User, ActorKind.Agent],
  endpoint: { method: HttpMethod.Put, path: "/loyalty/accounts/:accountId/freeze" },
  tool: true,
}) {
  /** Loads the account and flips the flag. */
  private readonly accounts: AccountService;

  /** @param accounts - loads the account and flips the flag. */
  constructor(accounts: AccountService) {
    super();
    this.accounts = accounts;
  }

  /**
   * Loads the account, authorizes the freeze against it and sets the flag.
   *
   * @throws NotFoundError when no account has this id in the caller's scope; a `forbidden` refusal when the record
   *         check denies.
   */
  async handle(input: FreezeAccountInput, ctx: ActionContext): Promise<FreezeAccountOutput> {
    const account = await this.accounts.findOneOrFail({ id: input.accountId });
    await ctx.authorize(account);
    await this.accounts.setFrozen(account, input.isFrozen, ctx.now());
    return FreezeAccountOutput.create({ accountId: account.id, isFrozen: account.isFrozen });
  }
}
