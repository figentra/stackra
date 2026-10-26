/**
 * Stackra file contract:
 * Purpose: `liveProviderOf(entry)`, the provider code of one market-pack provider-list entry when it is served: a
 *          non-empty code, or an object `{ provider, status }` whose status is `live` or absent.
 * Boundary: internal and pure; anything else (a `planned` entry, a number, an object without a provider) is not served.
 * Runtime: isomorphic
 * Governing contract: ADR 0370; ADR 0422 (decision 3).
 */

/**
 * The served provider code of `entry`, or undefined.
 *
 * @example
 * liveProviderOf({ provider: "unifonic", status: "live" }); // "unifonic"
 */
export function liveProviderOf(entry: unknown): string | undefined {
  if (typeof entry === "string") return entry === "" ? undefined : entry;
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return undefined;
  const provider: unknown = Reflect.get(entry, "provider");
  const status: unknown = Reflect.get(entry, "status");
  if (typeof provider !== "string" || provider === "") return undefined;
  return status === undefined || status === "live" ? provider : undefined;
}
