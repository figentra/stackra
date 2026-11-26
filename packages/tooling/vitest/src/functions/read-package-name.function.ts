/**
 * Stackra file contract:
 * Purpose: `readPackageName(root)`, the `name` of the `package.json` in a member root, so `withCoverage` can pick
 *          that member's coverage floor.
 * Boundary: reads one file; answers `undefined` when the file is missing, unreadable or has no string `name`.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 2: coverage floors per package group).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The package name in `<root>/package.json`.
 *
 * @param root - the member root.
 * @returns the name, or `undefined` when there is none to read.
 * @example
 * readPackageName("/repo/packages/security/iam"); // "@stackra/iam"
 */
export function readPackageName(root: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const name = (parsed as { name?: unknown } | null)?.name;
    return typeof name === "string" ? name : undefined;
  } catch {
    return undefined;
  }
}
