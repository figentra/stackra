/**
 * Stackra file contract:
 * Purpose: `ActionInput<A>`, the input of a consumed action, for code that builds it apart from the call (a form's
 *          `toInput`).
 * Boundary: a type only; the action-named form of `RefInput`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3).
 */
import type { ActionRef } from "#core/types/action-ref.type";
import type { RefInput } from "#core/types/ref-input.type";

/**
 * The input of the action `A`.
 *
 * @example
 * static toInput(values: QuickOrderForm): ActionInput<typeof CreateOrderAction> { ... }
 */
export type ActionInput<A extends ActionRef> = RefInput<A>;
