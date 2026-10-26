/**
 * Stackra file contract:
 * Purpose: `findKits(sources)`, the kit discovery: every kit a registry file lists (`{ "kits": [<path>, …] }`, paths
 *          relative to the registry), then every folder in `STACKRA_BRAND_KITS` (`:`-separated), then every folder
 *          given on the command line. A later source with the same kit id replaces the earlier one.
 * Boundary: reads `kit.json` files only. A registry path that is missing or holds no kit is skipped with a note (a
 *           sibling repository may not be checked out); a folder named by the variable or the command line must be a
 *           kit, so it throws.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 4); ported from figentra/os `tools/brand-kit/lib/kits.mjs` (ORIGIN.md).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { LocatedKit } from "#contracts/types/located-kit.type";
import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { readKit } from "#node/functions/read-kit.function";

/**
 * The kits the sources name, and a note for each registry entry skipped.
 *
 * @param sources.registry - a registry file, when there is one.
 * @param sources.variable - the value of `STACKRA_BRAND_KITS`, when set.
 * @param sources.folders - kit folders from the command line.
 * @throws InvalidKitError when the registry is unreadable or a folder from the variable or the command line is no kit.
 * @example
 * const { kits, skipped } = findKits({ registry: "kits.json", variable: process.env["STACKRA_BRAND_KITS"], folders: [] });
 */
export function findKits(sources: {
  readonly registry?: string | undefined;
  readonly variable?: string | undefined;
  readonly folders: readonly string[];
}): { readonly kits: LocatedKit[]; readonly skipped: string[] } {
  const found = new Map<string, LocatedKit>();
  const skipped: string[] = [];
  const add = (located: LocatedKit): void => {
    found.delete(located.kit.id);
    found.set(located.kit.id, located);
  };
  if (sources.registry !== undefined) {
    let listed: unknown;
    try {
      listed = (JSON.parse(readFileSync(sources.registry, "utf8")) as { kits?: unknown }).kits;
    } catch (error) {
      throw new InvalidKitError(sources.registry, [
        `unreadable registry: ${(error as Error).message}`,
      ]);
    }
    if (!Array.isArray(listed) || listed.some((path) => typeof path !== "string"))
      throw new InvalidKitError(sources.registry, ['"kits" is not a list of folders']);
    for (const path of listed as string[]) {
      const dir = resolve(dirname(sources.registry), path);
      if (!existsSync(dir)) {
        skipped.push(`${dir}: not checked out`);
        continue;
      }
      try {
        add(readKit(dir));
      } catch (error) {
        if (!(error instanceof InvalidKitError)) throw error;
        skipped.push(error.message);
      }
    }
  }
  for (const dir of (sources.variable ?? "").split(":").filter((path) => path !== ""))
    add(readKit(dir));
  for (const dir of sources.folders) add(readKit(dir));
  return { kits: [...found.values()], skipped };
}
