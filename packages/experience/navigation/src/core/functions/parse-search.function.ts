/**
 * Stackra file contract:
 * Purpose: `parseSearch(query, type)`, the query of a route as its context and page see it: the entries checked
 *          against the route's `search` shape (defaults applied) with an invalid entry dropped and the rest kept, or
 *          the raw entries for a route that declares no shape.
 * Boundary: a trust boundary: the query is untrusted. Never throws for bad input; a shape that rejects even the kept
 *           entries gives `{}`. A repeated name keeps its first value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0055 (validation with the shape's schema).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import { validate } from "@stackra/validation";

/**
 * The parsed query of route class `type`.
 *
 * @example
 * parseSearch(new URL(request.url).searchParams, StoreRoute); // a StoreSearch with `q`, `collection`, `cursor`
 */
export function parseSearch(query: URLSearchParams, type: AnyClass): object {
  const raw: Record<string, string> = {};
  for (const [name, value] of query.entries()) raw[name] ??= value;
  const shape = kindOf(type)?.options["search"];
  if (typeof shape !== "function") return raw;
  const first = validate(shape as AnyClass, raw);
  if (first.success) return first.data;
  const refused = new Set(first.error.issues.map((issue) => String(issue.path[0])));
  const second = validate(
    shape as AnyClass,
    Object.fromEntries(Object.entries(raw).filter(([name]) => !refused.has(name))),
  );
  return second.success ? second.data : {};
}
