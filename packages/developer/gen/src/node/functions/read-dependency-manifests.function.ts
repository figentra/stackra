/**
 * Stackra file contract:
 * Purpose: `readDependencyManifests`, the committed `stackra.manifest.json` of each dependency that has one, found
 *          through the `node_modules` folders from the member root upward, in package.json order: how gen learns a
 *          dependency's kinds, identities, drivers and modules without reading its `.d.ts`.
 * Boundary: reads files only; a dependency without a manifest is skipped (it ships no kind classes). A manifest that
 *           is not valid JSON fails the run, since a host cannot be wired from it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 25: a dependency's options come from its committed manifest); ADR 0127
 *                     2026-10-24 note (`ir` folds into gen: the manifest is the IR).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import type { MemberIR } from "#core/types/member-ir.type";

/** The manifest file of `dependency`, searched from `root` up. */
function manifestPath(root: string, dependency: string): string | undefined {
  for (let directory = root; ; directory = dirname(directory)) {
    const candidate = join(directory, "node_modules", dependency, "stackra.manifest.json");
    if (existsSync(candidate)) return candidate;
    if (dirname(directory) === directory) return undefined;
  }
}

/**
 * The manifests of `dependencies`.
 *
 * @param root - the member root.
 * @param dependencies - the dependency package names, in package.json order.
 * @throws Error when a manifest is not valid JSON.
 * @example
 * readDependencyManifests("/repo/services/commerce", ["@acme/loyalty-kit"])[0]?.manifest.member; // "loyalty_kit"
 */
export function readDependencyManifests(
  root: string,
  dependencies: readonly string[],
): MemberIR["dependencies"] {
  const found: { package: string; manifest: StackraManifest }[] = [];
  for (const dependency of new Set(dependencies)) {
    const path = manifestPath(root, dependency);
    if (path === undefined) continue;
    try {
      found.push({
        package: dependency,
        manifest: JSON.parse(readFileSync(path, "utf8")) as StackraManifest,
      });
    } catch (error) {
      throw new Error(`${path} is not valid JSON: ${(error as Error).message}`, { cause: error });
    }
  }
  return found;
}
