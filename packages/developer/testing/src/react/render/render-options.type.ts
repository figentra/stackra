/**
 * Stackra file contract:
 * Purpose: `RenderOptions`, what `render(ui, options)` of `./react` takes: Testing Library's options, a `wrapper`
 *          around the subject, and a `providers` list composed into one wrapper outside it.
 * Boundary: a type only. Provider-agnostic: this package knows no house provider; a framework package passes its own
 *           (the container, i18n, the router stub) through `providers` or `wrapper`.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import type { RenderOptions as LibraryRenderOptions } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";

/** The options of one web render. */
export interface RenderOptions extends Omit<LibraryRenderOptions, "wrapper" | "queries"> {
  /** Wraps the subject, inside every provider. */
  readonly wrapper?: ComponentType<{ readonly children?: ReactNode }>;

  /** Providers around the subject and its wrapper, the first outermost. */
  readonly providers?: readonly ComponentType<{ readonly children?: ReactNode }>[];
}
