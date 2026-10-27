/**
 * Stackra file contract:
 * Purpose: `routePath`: the path a route class declared in `Route({ path })`, read from the kind registry.
 * Boundary: a pure read, in its own file; the path lives in the route's options, never in a static of its own.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 25); ADR 0305 (rule 10).
 */
import { kindOf } from "@stackra/container";

/**
 * The path `type` declared in `Route({ path })`.
 *
 * @throws TypeError when `type` is not a route class or declared no path.
 */
export function routePath(type: object): string {
  const record = kindOf(type);
  const path = record?.kind === "route" ? record.options["path"] : undefined;
  if (typeof path !== "string")
    throw new TypeError(`${String((type as { name?: unknown }).name)} declares no Route path`);
  return path;
}
