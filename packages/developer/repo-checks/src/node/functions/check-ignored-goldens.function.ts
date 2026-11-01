/**
 * Stackra file contract:
 * Purpose: `checkIgnoredGoldens(paths, isIgnored)`, every file under a `__golden__` folder that git would ignore, so a
 *          golden that was never committed cannot pass (the root `.stackra/` ignore rule once dropped them silently).
 * Boundary: pure: paths and the ignore predicate only; `ignoredGoldenFindings` supplies the paths and asks git.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: `.stackra/` is gitignored); STA-1807.
 */

/**
 * The findings for the golden files in `paths` that `isIgnored` reports.
 *
 * @param paths - repository-relative paths, on disk.
 * @param isIgnored - whether git would ignore the path.
 * @example
 * checkIgnoredGoldens(["a/__golden__/x/.stackra/y.ts"], () => true); // one finding
 */
export function checkIgnoredGoldens(
  paths: readonly string[],
  isIgnored: (path: string) => boolean,
): string[] {
  return paths
    .filter((p) => p.split("/").includes("__golden__") && isIgnored(p))
    .map(
      (p) =>
        `${p}: git ignores this golden file, so it is never committed; add a .gitignore re-include for its folder`,
    );
}
