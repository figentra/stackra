/**
 * Stackra file contract:
 * Purpose: `SurfaceBundleJob`, one surface's extension bundle to build: the generated entry, the shell's import map
 *          whose specifiers stay external, and the output folder.
 * Boundary: type only; `SurfaceBundler` takes it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4: extension bundles with the shell's shared dependencies as externals).
 */

/** One surface bundle to build. */
export type SurfaceBundleJob = {
  /** The product root (absolute), where the build resolves the packages. */
  readonly root: string;
  /** The surface key. */
  readonly surface: string;
  /** The generated entry module (absolute). */
  readonly entry: string;
  /** The shell's import map: every specifier it maps stays an external import. */
  readonly importMap: { readonly imports: Readonly<Record<string, string>> };
  /** The output folder (absolute), `<bundleDir>/<surface>/<version>`. */
  readonly outDir: string;
};
