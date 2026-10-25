/**
 * Stackra file contract:
 * Purpose: `LoyaltyKitExtensionPoint`, the kit's extension point: the seams where another module may change how many
 *          points a purchase earns, or refuse a redemption before anything is debited.
 * Boundary: the seam this module owns and publishes, part of its contract like an event; an extension is one class in
 *           any module that plugs into one slot (`extends Extension<LoyaltyKitExtensionPoint["earnAdjust"]>` with one
 *           `handle`). `after` runs once the kit computed a value and each extension returns the value adjusted, in
 *           ascending `order`; `before` runs ahead of the kit's step and an extension may refuse by throwing a Refusal
 *           or return replacement arguments. `AccountService` and the redemption inject this class and call each slot
 *           as a method. Slot keys are `loyalty_kit.earnAdjust` and `loyalty_kit.redeemVerify`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13, 16 and 23); ADR 0305 (rules 22 to 25); ADR 0265 as amended.
 */
import { ExtensionPoint } from "@stackra/actions";

import type { EarnDraft } from "#contracts/types/earn-draft.type";
import type { RedeemPointsInput } from "#node/schemas/redeem-points-input.schema";

/**
 * Part of the kit's contract: a renamed slot needs `@Renamed`, like any identity.
 *
 * @example
 * const points = await this.extensions.earnAdjust(base, draft, ctx);
 */
export class LoyaltyKitExtensionPoint extends ExtensionPoint {
  /** After the base earn is computed; each extension returns the points it adjusted. */
  readonly earnAdjust = ExtensionPoint.after<number, [draft: EarnDraft]>();

  /**
   * Before a redemption quotes and debits; an extension refuses by throwing a Refusal, or returns the input it wants
   * the redemption to use instead.
   */
  readonly redeemVerify = ExtensionPoint.before<[input: RedeemPointsInput]>();
}
