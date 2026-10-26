/**
 * Stackra file contract:
 * Purpose: `ConfirmRedemptionAction`, `loyalty_kit.points.confirm_redemption@1`: the host's "the order went through"
 *          for a redemption, so the parked `RedeemPointsWorkflow` keeps the debit instead of crediting it back when its
 *          wait times out.
 * Boundary: inline and idempotent (PUT): it only sends `RedemptionConfirmed`, the one way a waiting run resumes, so
 *           permission, isolation and the audit trail apply to every confirmation. The member is the actor, or the
 *           customer a service acts for; a member confirms only their own redemption, because the waiting step
 *           correlates on member and reference. The sample's path is kept, so `endpoint` is written; no `tool` (a
 *           confirmation is the host's, not an agent's).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 16, 18 and 21); ADR 0305 (rule 28); ADR 0098; ADR 0101; ADR 0152
 *                     (decision 1: `waitFor`).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind, HttpMethod } from "@stackra/contracts";

import { memberId } from "#core/functions/member-id.function";
import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";
import type { ConfirmRedemptionInput } from "#node/schemas/confirm-redemption-input.schema";
import { ConfirmRedemptionOutput } from "#node/schemas/confirm-redemption-output.schema";
import { RedemptionConfirmed } from "#node/workflows/redemption-confirmed.signal";

/**
 * Called by the host once its own step succeeded, usually by a service acting for the customer; a repeated call sends
 * the same signal and changes nothing.
 *
 * @example
 * await pipeline.execute(ConfirmRedemptionAction, { reference: "ord_2" }, { actor: checkoutForCustomer });
 */
export class ConfirmRedemptionAction extends Action({
  key: "points.confirm_redemption",
  permission: LoyaltyAccountPermissions.redeem,
  actors: [ActorKind.User, ActorKind.Service],
  endpoint: { method: HttpMethod.Put, path: "/loyalty/redemptions/:reference/confirm" },
  // reason: a confirmation is the host's, after its own step succeeded, not an agent's
  tool: false,
}) {
  /** Sends the signal the redemption's `confirm` step waits for; the engine holds an early one. */
  async handle(
    input: ConfirmRedemptionInput,
    ctx: ActionContext,
  ): Promise<ConfirmRedemptionOutput> {
    const member = memberId((ctx.actor.onBehalfOf ?? ctx.actor).id);
    // the parked step correlates on member and reference, so the confirmation is its own correlation
    const confirmation = { memberId: member, reference: input.reference };
    await ctx.signal(RedemptionConfirmed, confirmation, confirmation);
    return ConfirmRedemptionOutput.create({ reference: input.reference });
  }
}
