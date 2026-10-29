/**
 * Stackra file contract:
 * Purpose: `exportSourceOf(pkg, subpath)`, the source file a product package's export names: the `@stackra/source`
 *          condition, else `default`, else a plain string target; `undefined` when the package has no such export.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 2); ADR 0025 (the `@stackra/source` condition).
 */
import { resolve } from "node:path";

import type { WorkspacePackage } from "#node/types/workspace-package.type";

/** The source file an export target names. */
function targetOf(target: unknown): string | undefined {
  if (typeof target === "string") return target;
  if (typeof target !== "object" || target === null) return undefined;
  const conditions = target as Record<string, unknown>;
  return targetOf(conditions["@stackra/source"] ?? conditions["default"]);
}

/**
 * The source file of `pkg`'s `subpath` export, or `undefined` when it has none.
 *
 * @example
 * exportSourceOf(pkg, "./console"); // "/repo/packages/application/example/src/console.tsx"
 */
export function exportSourceOf(pkg: WorkspacePackage, subpath: string): string | undefined {
  const target = targetOf(pkg.exports[subpath]);
  return target === undefined ? undefined : resolve(pkg.dir, target);
}
