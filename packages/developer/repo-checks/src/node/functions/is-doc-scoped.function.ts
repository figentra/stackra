/**
 * Stackra file contract:
 * Purpose: `isDocScoped(path)`, the source files the doc standard governs: a `src/` file of a package, service, app or
 *          worker, minus tests, generated code and declaration files.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0007 (amendment 2026-10-21).
 */

/**
 * True for a source file the doc-standard check reads.
 *
 * @param path - repository-relative path, forward slashes.
 * @example
 * isDocScoped("packages/data/storage/src/core/a.ts"); // true
 */
export function isDocScoped(path: string): boolean {
  if (!/^(packages|services|apps|workers)\/.+\/src\/.+\.(?:tsx?|mts|cts)$/.test(path)) return false;
  return !/(__tests__\/|\.test\.(?:tsx?|mts|cts)$|\.d\.(?:ts|mts|cts)$|\/generated\/|encore\.gen\/)/.test(
    path,
  );
}
