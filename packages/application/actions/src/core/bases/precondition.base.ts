/**
 * Stackra file contract:
 * Purpose: `Precondition`, the kind base of a check whether a call may run now, whoever asks (ordering paused,
 *          maintenance): `extends Precondition` with `check(ctx)`, listed in an action's `preconditions`.
 * Boundary: bare only (it takes no options). A binding: its dependencies are its constructor parameters, wired by gen.
 *           It runs after the tenancy and permission steps and before entitlement, sees the call context and never the
 *           record or the input, and refuses by throwing a Refusal. Queries take no preconditions.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 23: Precondition, never Guard or Gate); ADR 0138 (as amended); ADR
 *                     0140 (the precondition category).
 */
import { registerKind } from "@stackra/container";

import type { PreconditionContext } from "#core/types/precondition-context.type";

/**
 * The precondition kind base.
 *
 * @example
 * export class AcceptingOrdersPrecondition extends Precondition {
 *   constructor(settings: SettingsReader) {
 *     super();
 *     this.settings = settings;
 *   }
 *
 *   async check(_ctx: PreconditionContext): Promise<void> {
 *     const { acceptingOrders } = await this.settings.get(OrdersSettings);
 *     if (!acceptingOrders) throw OrdersPausedError.create();
 *   }
 * }
 */
export abstract class Precondition {
  /** Type-only kind brand, so a class of another kind cannot stand in for a precondition. */
  declare readonly "~kind": "precondition";

  /**
   * Resolves when the call may run now.
   * @throws Refusal (usually of kind `FailedPrecondition`) when it may not.
   */
  abstract check(ctx: PreconditionContext): Promise<void>;
}

registerKind(Precondition, "precondition");
