/**
 * Stackra file contract:
 * Purpose: `splitName`: the scope of a scoped name.
 * Boundary: pure; no method check and no lookup (the router does both).
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 4 and 12).
 */

/**
 * The scope of a scoped name.
 *
 * @example
 * splitName("@stackra/core"); // { scope: "@stackra", bare: "core" }
 */
export function splitName(name: string): { readonly scope: string; readonly bare: string } {
  const slash = name.indexOf("/");
  return { scope: name.slice(0, slash), bare: name.slice(slash + 1) };
}
