/**
 * Stackra file contract:
 * Purpose: `RenderOptions`, what `render(ui, options)` of `./native` takes: a `wrapper` around the subject and a
 *          `providers` list composed into one wrapper outside it (React Native Testing Library's only option is the
 *          wrapper).
 * Boundary: a type only. Provider-agnostic: a framework package passes its own providers.
 * Runtime: react-native
 * Governing contract: ADR 0269 (decisions 2 and 6).
 */
import type { ComponentType, ReactNode } from "react";

/** The options of one native render. */
export interface RenderOptions {
  /** Wraps the subject, inside every provider. */
  readonly wrapper?: ComponentType<{ readonly children?: ReactNode }>;

  /** Providers around the subject and its wrapper, the first outermost. */
  readonly providers?: readonly ComponentType<{ readonly children?: ReactNode }>[];
}
