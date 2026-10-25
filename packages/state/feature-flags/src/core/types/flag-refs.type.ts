/**
 * Stackra file contract:
 * Purpose: `FlagRefs<T>`, what `flagRefs(tree)` returns: the same module and flag names, each a `FlagRef` keyed
 *          `<module>.<name>` for a declared class, or by the written-out `key` for a consumed flag.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: derived flag keys).
 */
import type { FlagRef } from "#core/types/flag-ref.type";

/** Module to flag name to typed reference. */
export type FlagRefs<T> = {
  readonly [M in keyof T & string]: {
    readonly [N in keyof T[M] & string]: FlagRef<
      T[M][N] extends { readonly key: infer K extends string } ? K : `${M}.${N}`
    >;
  };
};
