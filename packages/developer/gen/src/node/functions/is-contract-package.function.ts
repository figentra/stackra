/**
 * Stackra file contract:
 * Purpose: `isContractPackage`, whether a declared dependency is a service contract package: its `package.json` has
 *          `stackra.kind` `contract` (a producer's published manifest, OpenAPI and lang, no source), by the kind and
 *          never by the package name (STA-1820).
 * Boundary: reads the dependency's `package.json` through `dependencyPath`; a dependency that is not installed or has
 *           no readable package.json is not a contract. Writes nothing.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11 and its contract amendment); ADR 0260 (decision 1: one contract source).
 */
import { readFileSync } from "node:fs";

import { dependencyPath } from "#node/functions/dependency-path.function";

/**
 * True when `dependency` is installed for the member at `root` and declares `stackra.kind` `contract`.
 *
 * @param root - the member root.
 * @param dependency - the dependency package name.
 * @example
 * isContractPackage("/repo/apps/console", "@figentra/commerce-contract"); // true
 */
export function isContractPackage(root: string, dependency: string): boolean {
  const path = dependencyPath(root, dependency, "package.json");
  if (path === undefined) return false;
  try {
    const { stackra } = JSON.parse(readFileSync(path, "utf8")) as {
      stackra?: { kind?: unknown };
    };
    return stackra?.kind === "contract";
  } catch {
    return false;
  }
}
