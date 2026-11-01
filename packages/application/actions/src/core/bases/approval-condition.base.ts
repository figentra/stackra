/**
 * Stackra file contract:
 * Purpose: `ApprovalCondition`, the kind base of the question "does this call need approval": `extends
 *          ApprovalCondition` with `needed(input, ctx)`, named by an action's `approval.when`. The threshold is data,
 *          the comparison is code.
 * Boundary: bare only (it takes no options). A binding: its constructor takes only its `ApprovalSettingsReader` (built
 *           by `limitedSettingsReader` over its static `reads`) and platform plan and entitlement values; gen refuses any
 *           other dependency and any `reads` key not marked `approval`. It runs inside the call's isolation run, after
 *           validation, and a condition that throws fails the call (it is never read as "not needed"). File:
 *           `access/<name>.approval-condition.ts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the declared floor and its condition); ADR 0294 (decision 16); STA-1724 FR-002.
 */
import { registerKind } from "@stackra/container";

import type { ActionContext } from "#core/types/action-context.type";

/**
 * The approval condition kind base.
 *
 * @example
 * export class CouponAboveThresholdCondition extends ApprovalCondition {
 *   static override readonly reads = ["billing.coupon.maxPercent"] as const;
 *
 *   constructor(private readonly settings: ApprovalSettingsReader) {
 *     super();
 *   }
 *
 *   async needed(input: UpdateCouponInput, _ctx: ActionContext): Promise<boolean> {
 *     return input.percent > Number(await this.settings.get("billing.coupon.maxPercent"));
 *   }
 * }
 */
export abstract class ApprovalCondition {
  /** The settings keys the condition reads; each must be a key marked `approval`. None when absent. */
  static readonly reads: readonly string[] = [];

  /** Type-only kind brand, so a class of another kind cannot stand in for an approval condition. */
  declare readonly "~kind": "approval_condition";

  /**
   * Whether the call needs approval. The subclass types `input`.
   *
   * @throws anything: a throw fails the call and never reads as "not needed".
   */
  abstract needed(input: never, ctx: ActionContext): Promise<boolean>;
}

registerKind(ApprovalCondition, "approval_condition");
