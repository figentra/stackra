/**
 * Stackra file contract:
 * Purpose: `starterRegion(files)`, the region an app's root runway already places it in, read from the files
 *          `starterFiles` returned: staging's `region`, else production's, else the first key either deploys to
 *          (`regions`); with the root `regions` a typed answer resolves against (`resolveRegion`).
 * Boundary: pure; an absent or unreadable `runway.yaml` reads as no region and no `regions`.
 * Runtime: node
 * Governing contract: ADR 0515 (decision 3); ADR 0524 (amendment 2026-11-27, STA-2896).
 */
import type { RootRunway } from "@stackra/runway";
import { parse } from "yaml";

import type { StarterRegion } from "#node/create/types/starter-region.type";

/** One environment block, as far as placement goes. */
type Placed = { readonly region?: unknown; readonly regions?: unknown };

const decoder = new TextDecoder();

/** The first item of a list, `undefined` for anything else. */
const first = (list: unknown): unknown => (Array.isArray(list) ? list[0] : undefined);

/**
 * Where the app's files place it.
 *
 * @param files - the app's files by POSIX path.
 * @example
 * starterRegion(starterFiles(starter, options));
 * // { name: "me", regions: { me: { cloud: "aws", location: "me-central-1" } } }
 */
export function starterRegion(files: ReadonlyMap<string, Uint8Array>): StarterRegion {
  const bytes = files.get("runway.yaml");
  let root: { environments?: Record<string, Placed>; regions?: unknown } | undefined;
  try {
    root = bytes === undefined ? undefined : (parse(decoder.decode(bytes)) ?? undefined);
  } catch {
    root = undefined;
  }
  const staging = root?.environments?.["staging"];
  const production = root?.environments?.["production"];
  const name = [
    staging?.region,
    production?.region,
    first(staging?.regions),
    first(production?.regions),
  ].find((value): value is string => typeof value === "string");
  const regions =
    typeof root?.regions === "object" && root.regions !== null
      ? (root.regions as NonNullable<RootRunway["regions"]>)
      : {};
  return { name, regions };
}
