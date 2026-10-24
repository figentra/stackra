/**
 * Stackra file contract:
 * Purpose: `GeneratedFile`, one file a gen run produces: its path relative to the member root and its full content.
 * Boundary: a type only. `generate` writes these, or with `check` compares them with what is on disk.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 10: generated output is never authored); ADR 0295 (decisions 5 and 7).
 */

/** One generated file. */
export interface GeneratedFile {
  /** The path relative to the member root (`.stackra/gen/wiring.ts`, `stackra.manifest.json`). */
  readonly path: string;

  /** The whole content. */
  readonly content: string;
}
