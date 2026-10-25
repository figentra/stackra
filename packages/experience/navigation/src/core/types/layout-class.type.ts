/**
 * Stackra file contract:
 * Purpose: `LayoutClass<O>`, the class `Layout` is and `Layout({...})` returns, and the type of any layout class.
 * Boundary: a type only, one abstract construct signature, so `class X extends Layout` calls `super()` while its own
 *           constructor takes its dependencies.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25).
 */
import type { Layout } from "#core/bases/layout.base";
import type { LayoutOptions } from "#core/types/layout-options.type";

/** A layout class declared with options `O`. */
export type LayoutClass<O extends LayoutOptions = LayoutOptions> = abstract new (
  ...args: never[]
) => Layout<O>;
