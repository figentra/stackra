/**
 * Stackra file contract:
 * Purpose: `StateField<M>`, the fields of model `M` a machine may govern: those typed as a closed set of string codes
 *          (an `Enum.Value`), which is what `StateMachine<M>({ field })` accepts.
 * Boundary: a type only. A plain `string`, a template literal (a `PublicId`) and a non-string field are left out,
 *           because their values are not a closed set; gen checks the transition states against the field's enum
 *           (STA-340).
 * Runtime: isomorphic
 * Governing contract: ADR 0161 (0294 note: the states are the `Enum.of` of the field); ADR 0305 (rule 5).
 */

/**
 * The state fields of `M`.
 *
 * @example
 * type F = StateField<Order>; // "status": not `id` (a PublicId) nor `customerId` (a string)
 */
export type StateField<M> = {
  [K in keyof M]-?: M[K] extends string
    ? Record<never, never> extends Record<M[K], unknown>
      ? never
      : K
    : never;
}[keyof M] &
  string;
