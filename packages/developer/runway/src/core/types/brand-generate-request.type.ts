/**
 * Stackra file contract:
 * Purpose: `BrandGenerateRequest`, one run of the brand step: the kit folder, the store tree with the captions, the
 *          output folder and, after the screenshot job, the captured screens to frame. Paths are relative to the
 *          product repository's root.
 * Boundary: type only; `brandGenerateRequest` builds it from the root runway.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 1, 5 and 7).
 */

/** One brand run. */
export interface BrandGenerateRequest {
  /** The kit folder, `<assets root>/brand`. */
  readonly kit: string;

  /** The store tree with the screenshot captions, `<assets root>/store`. */
  readonly store: string;

  /** The output folder, `.stackra/brand`. */
  readonly out: string;

  /** The captured screens, `<app>/<locale>/<name>.png`; no store frames without it. */
  readonly screenshots?: string;
}
