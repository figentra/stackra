/**
 * Stackra file contract:
 * Purpose: `jscpdArgs(srcDir, part, minTokens, output)`, the jscpd arguments for one part of a member's `src/`:
 *          `src` without the test folders, or `tests` alone (moved from `tools/scripts/duplication.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */

/** The test folders, measured apart from the source: most of the largest clones are test-to-test (B-9). */
const TESTS_GLOB = "**/__tests__/**";

/**
 * The argument list of one jscpd run.
 *
 * @param srcDir - the member's `src/`, repository-relative.
 * @param part - `src` or `tests`.
 * @param minTokens - jscpd's `--min-tokens`.
 * @param output - the report folder.
 * @example
 * jscpdArgs("packages/data/a/src", "src", 50, "/tmp/out")[0]; // "packages/data/a/src"
 */
export function jscpdArgs(
  srcDir: string,
  part: "src" | "tests",
  minTokens: number,
  output: string,
): string[] {
  return [
    srcDir,
    "--min-tokens",
    String(minTokens),
    "--format",
    "typescript,tsx,javascript,jsx",
    part === "tests" ? "--pattern" : "--ignore",
    TESTS_GLOB,
    "--reporters",
    "json",
    "--output",
    output,
    "--silent",
  ];
}
