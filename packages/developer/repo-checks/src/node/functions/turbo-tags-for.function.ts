/**
 * Stackra file contract:
 * Purpose: `turboTagsFor(field)`, the turbo tags a member's `stackra` field implies, in order: `tier:<tier>`, then
 *          `category:<category>` (packages only), then `runtime:<r>` for each runtime in `runtimes` order.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11, amendment of 2026-10-27); ADR 0003 (tiers).
 */

/**
 * The turbo tags of a member.
 *
 * @param field - the member's `stackra.tier`, `stackra.category` (absent for apps, services and Workers) and
 *   `stackra.runtimes`.
 * @example
 * turboTagsFor({ tier: "lib", category: "data", runtimes: ["isomorphic", "node"] });
 * // ["tier:lib", "category:data", "runtime:isomorphic", "runtime:node"]
 */
export function turboTagsFor(field: {
  readonly tier: string;
  readonly category?: string | null | undefined;
  readonly runtimes: readonly string[];
}): string[] {
  return [
    `tier:${field.tier}`,
    ...(field.category ? [`category:${field.category}`] : []),
    ...field.runtimes.map((runtime) => `runtime:${runtime}`),
  ];
}
