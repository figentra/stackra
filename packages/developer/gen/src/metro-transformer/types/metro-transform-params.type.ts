/**
 * Stackra file contract:
 * Purpose: `MetroTransformParams`, what Metro passes a Babel transformer's `transform` (its file name, source, options
 *          with the project root, and the plugins Metro adds), as far as gen's transformer reads it.
 * Boundary: a type only; the rest of Metro's options pass through to the upstream transformer untouched.
 * Runtime: node
 * Governing contract: ADR 0127 2026-10-24 note (the `@stackra/gen/metro-transformer` tool hook); ADR 0305 (rule 40).
 */

/** The argument of a Metro Babel transformer's `transform`. */
export interface MetroTransformParams {
  /** The file's path relative to the project root. */
  readonly filename: string;

  /** The file's source. */
  readonly src: string;

  /** Metro's transform options; `projectRoot` locates the upstream transformer. */
  readonly options: { readonly projectRoot: string; readonly [option: string]: unknown };

  /** The Babel plugins Metro adds. */
  readonly plugins?: readonly unknown[];

  /** Everything else Metro passes. */
  readonly [field: string]: unknown;
}
