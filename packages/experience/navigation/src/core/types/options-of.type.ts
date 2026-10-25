/**
 * Stackra file contract:
 * Purpose: `OptionsOf<T>`, the options a route or layout instance was declared with, read from its type-only
 *          `~options` member.
 * Boundary: a type only, internal to the context and props types.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25).
 */

/** The declared options of route or layout instance `T`, or `never`. */
export type OptionsOf<T> = T extends { readonly "~options": infer O } ? O : never;
