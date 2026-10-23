/**
 * Stackra file contract:
 * Purpose: `Omit` applied to each member of a union, so a discriminated union of props (HeroUI Native's button
 *          props, split by `feedbackVariant`) keeps its members after keys are removed.
 * Boundary: a type only; internal, so it is not in the `./contracts` barrel and `native/` imports it by path.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: unknown props pass through, typed).
 */

/** `Omit<T, K>` for each member of the union `T`, keeping the union. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
