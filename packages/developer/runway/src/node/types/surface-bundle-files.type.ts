/**
 * Stackra file contract:
 * Purpose: `SurfaceBundleFiles`, what a built surface bundle holds, relative to its folder: the entry, the chunks to
 *          preload, the stylesheets and the bare specifiers it leaves to the import map.
 * Boundary: type only; a `SurfaceBundler` answers it and `buildProduct` writes it into the bundle manifest.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4).
 */

/** What a built bundle holds, relative to its folder. */
export type SurfaceBundleFiles = {
  /** The entry module. */
  readonly entry: string;
  /** The chunks the Worker preloads. */
  readonly modulepreload: readonly string[];
  /** The stylesheets the entry loads. */
  readonly css: readonly string[];
  /** The bare specifiers the bundle leaves to the import map. */
  readonly imports: readonly string[];
};
