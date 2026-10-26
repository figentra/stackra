/**
 * Stackra file contract:
 * Purpose: `RenderHookOptions<Props>`, what `renderHook(hook, options)` of `./react` takes: Testing Library's options
 *          (`initialProps` among them), a `wrapper`, and a `providers` list composed into one wrapper outside it.
 * Boundary: a type only; provider-agnostic, like `RenderOptions`.
 * Runtime: browser
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import type { RenderHookOptions as LibraryRenderHookOptions } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";

/** The options of one hook render. */
export interface RenderHookOptions<Props> extends Omit<
  LibraryRenderHookOptions<Props>,
  "wrapper" | "queries"
> {
  /** Wraps the hook's host component, inside every provider. */
  readonly wrapper?: ComponentType<{ readonly children?: ReactNode }>;

  /** Providers around the hook's host component, the first outermost. */
  readonly providers?: readonly ComponentType<{ readonly children?: ReactNode }>[];
}
