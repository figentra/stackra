/**
 * Stackra file contract:
 * Purpose: `requiredTestFor(suffix)`, the test tier a kind suffix requires.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0182; ADR 0090 (the root module's integration test).
 */
import { KIND_FOLDERS } from "#node/constants/kind-folders.constant";
import { ROOT_MODULE } from "#node/constants/root-module.constant";

/**
 * The required test tier of `suffix`, or null when none is required.
 *
 * @param suffix - a file kind, for example `workflow`.
 * @example
 * requiredTestFor("workflow"); // "int"
 */
export function requiredTestFor(suffix: string): string | null {
  if (suffix === ROOT_MODULE.suffix) return ROOT_MODULE.test;
  return KIND_FOLDERS.find((k) => k.suffix === suffix)?.test ?? null;
}
