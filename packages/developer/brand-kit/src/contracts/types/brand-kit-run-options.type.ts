/**
 * Stackra file contract:
 * Purpose: `BrandKitRunOptions`, the generator options plus the run's folders and renderer: the store sources, the
 *          screenshots the capture job leaves (stackra-13) and the SVG renderer.
 * Boundary: a type in the leaf entry; it widens `BrandKitOptions` additively. Defaults are applied by the generator.
 * Runtime: isomorphic
 * Governing contract: ADR 0044 and ADR 0146 (config keys); ADR 0441 (as amended: D19).
 */
import type { BrandKitOptions } from "#contracts/types/brand-kit-options.type";
import type { SvgRenderer } from "#contracts/types/svg-renderer.type";

/**
 * Run options.
 *
 * @example
 * const options: BrandKitRunOptions = { root: ".", storeDir: "assets/store" };
 */
export interface BrandKitRunOptions extends BrandKitOptions {
  /** Store sources, relative to `root`. Default: `assets/store`. */
  readonly storeDir?: string;

  /** Captured screenshots (`<app>/<locale>/<screen>.png`), relative to `root`; never committed. Default: `.stackra/screenshots`. */
  readonly screenshotsDir?: string;

  /** The rasteriser. Default: resvg with the kit fonts. */
  readonly render?: SvgRenderer;
}
