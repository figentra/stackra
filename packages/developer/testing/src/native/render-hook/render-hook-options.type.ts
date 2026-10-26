/**
 * Stackra file contract:
 * Purpose: `RenderHookOptions<Props>`, what `renderHook(hook, options)` of `./native` takes: the hook's
 *          `initialProps`, a `wrapper`, and a `providers` list composed into one wrapper outside it.
 * Boundary: a type only; provider-agnostic, like `RenderOptions`.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import type { ComponentType, ReactNode } from "react";

/** The options of one native hook render. */
export interface RenderHookOptions<Props> {
  /** The props of the first render. */
  readonly initialProps?: Props;

  /** Wraps the hook's host component, inside every provider. */
  readonly wrapper?: ComponentType<{ readonly children?: ReactNode }>;

  /** Providers around the hook's host component, the first outermost. */
  readonly providers?: readonly ComponentType<{ readonly children?: ReactNode }>[];
}
