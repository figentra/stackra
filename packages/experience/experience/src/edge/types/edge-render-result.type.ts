/**
 * Stackra file contract:
 * Purpose: `EdgeRenderResult`, the outcome of `renderEdgeDocument`: the page's HTML, or the reason the Worker serves
 *          the shell instead, with the document revision to log.
 * Boundary: a type only. A failure carries the node path when one is known, never a prop's value (tenant text).
 * Runtime: isomorphic
 * Governing contract: ADR 0440 (fallback to the shell); app-shells-edge-and-extension.md section 16 point 6.
 */
import type { EdgeRenderFailure } from "#edge/enums/edge-render-failure.enum";

/** The page's HTML, or why the shell is served. */
export type EdgeRenderResult =
  | { readonly ok: true; readonly html: string; readonly revision: number }
  | {
      readonly ok: false;
      readonly reason: EdgeRenderFailure;
      readonly revision: number;
      readonly path?: string;
    };
