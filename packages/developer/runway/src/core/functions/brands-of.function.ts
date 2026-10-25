/**
 * Stackra file contract:
 * Purpose: `brandsOf(member)`, the per-brand builds an app member declares, from the runway facts.
 * Boundary: reads the facts only; an empty list when the member declares no `brands`.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 8), ADR 0296 (decision 1).
 */
import { memberFacts } from "#core/functions/member-facts.function";
import type { Brand } from "#core/types/brand.type";

/**
 * The member's brands.
 *
 * @param member - the member key (`shopper`).
 * @throws RunwayUnresolvedError when there are no facts or the member is absent.
 * @example
 * brandsOf("shopper").map((brand) => brand.appId);
 */
export function brandsOf(member: string): readonly Brand[] {
  return memberFacts(member).member.brands ?? [];
}
