/**
 * Stackra file contract:
 * Purpose: `RefusalDetails<R>`, the details a refusal class declares: its own fields, without the members every
 *          refusal shares and without methods. `X.create(details)` takes exactly this, so a missing or mistyped
 *          detail fails to compile.
 * Boundary: a type only. Iterating `keyof R` keeps each field's optional and readonly modifiers.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: a refusal's fields are the envelope's details), ADR 0140.
 */
import type { Refusal } from "#core/bases/refusal.base";

/**
 * The declared fields of refusal `R`.
 *
 * @example
 * type D = RefusalDetails<InsufficientStockError>; // { variantId: PublicId<"var">; available: number }
 */
export type RefusalDetails<R extends Refusal> = {
  [
    K in keyof R as K extends keyof Refusal
      ? never
      : R[K] extends (...args: never[]) => unknown
        ? never
        : K
  ]: R[K];
};
