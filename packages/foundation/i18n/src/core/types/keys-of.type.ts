/**
 * Stackra file contract:
 * Purpose: `KeysOf<N>`, the object `keys(...)` returns for a key tree: every leaf an `I18nKey`, every branch an object,
 *          and the leaves of a `_` list lifted onto their branch.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys).
 */
import type { I18nKey } from "#core/types/i18n-key.type";

/** `KeysOf<{ nav: ["home"] }>` is `{ readonly nav: { readonly home: I18nKey } }`. */
export type KeysOf<N> = N extends readonly string[]
  ? { readonly [Leaf in N[number]]: I18nKey }
  : { readonly [Segment in Exclude<keyof N, "_">]: KeysOf<N[Segment]> } & (N extends {
      readonly _: infer Leaves extends readonly string[];
    }
      ? { readonly [Leaf in Leaves[number]]: I18nKey }
      : unknown);
