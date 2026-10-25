/**
 * Stackra file contract:
 * Purpose: `EnrollMemberAction`, `loyalty_kit.account.enroll@1`: enroll a principal (staff) or oneself (customer).
 *          Inline `handle`, one transaction, reachable over HTTP, as an MCP tool, from the intent router and through a
 *          host's generated client.
 * Boundary: the action is the contract: key, input and output (the types of `handle`, schemas in `schemas/`), actors
 *           and its surfaces; `AccountService` does the work. The sample's path is kept, so `endpoint` is written.
 *           `tool: true` exposes it as `loyalty_kit_account_enroll`; `intent: true` takes its phrases from
 *           `loyalty_kit::actions.account.enroll.intents` in every locale. Its permission is derived from the key until
 *           @stackra/iam ships `LoyaltyAccountPermissions.enroll`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 3, 16 and 21); ADR 0305 (rules 28 and 30); ADR 0098; ADR 0136; ADR 0155;
 *                     ADR 0245 (intents).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind, HttpMethod, Realm } from "@stackra/contracts";

import { NotOwnPrincipalError } from "#core/errors/not-own-principal.error";
import { memberId } from "#core/functions/member-id.function";
import type { EnrollMemberInput } from "#node/schemas/enroll-member-input.schema";
import { EnrollMemberOutput } from "#node/schemas/enroll-member-output.schema";
import type { AccountService } from "#node/services/account.service";

/**
 * Creates the account at the address the client names; a second call for the same principal returns the existing
 * account (idempotent by nature, so PUT). The principal is read from the body, never from the path.
 *
 * @example
 * await pipeline.execute(EnrollMemberAction, { accountId, principalId: "usr_1" }, { actor });
 */
export class EnrollMemberAction extends Action({
  key: "account.enroll",
  actors: [ActorKind.User, ActorKind.Agent, ActorKind.Service],
  endpoint: { method: HttpMethod.Put, path: "/loyalty/accounts/:accountId" },
  tool: true,
  intent: true,
}) {
  /** Creates the account and records `account.enrolled`. */
  private readonly accounts: AccountService;

  /** @param accounts - creates the account and records `account.enrolled`. */
  constructor(accounts: AccountService) {
    super();
    this.accounts = accounts;
  }

  /**
   * A customer may only enroll themselves; the check is here, not in a policy, because no record exists yet.
   *
   * @throws NotOwnPrincipalError for a customer naming someone else.
   */
  async handle(input: EnrollMemberInput, ctx: ActionContext): Promise<EnrollMemberOutput> {
    if (ctx.actor.realm === Realm.Customer && input.principalId !== ctx.actor.id)
      throw NotOwnPrincipalError.create();
    const account = await this.accounts.enroll(
      memberId(input.principalId),
      input.tier,
      input.accountId,
    );
    return EnrollMemberOutput.create({ accountId: account.id, tier: account.tier });
  }
}
