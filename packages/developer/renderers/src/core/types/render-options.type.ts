/**
 * Stackra file contract:
 * Purpose: `RenderOptions`, what a caller may set on a render: the generator name the provenance comments carry.
 * Boundary: type only; `renderAssistant` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0286 (decision 6: Stackra and Vellum both call the renderers).
 */

/** Options of `renderAssistant`. */
export type RenderOptions = {
  /** Who generated the files (`stackra agents setup`, `vellum`); defaults to `@stackra/renderers`. */
  readonly generator?: string;
};
