/**
 * Stackra file contract:
 * Purpose: `productOf()`, the product (key and, for an edition, its base and version range) from the runway facts.
 * Boundary: reads the facts only; `null` when the root runway declares no `product`. Nothing is cached.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 2), ADR 0296 (decision 1).
 */
import { runwayFacts } from "#core/functions/runway-facts.function";
import type { Product } from "#core/types/product.type";

/**
 * The product, or `null` when none is declared.
 *
 * @throws RunwayUnresolvedError when there are no facts.
 * @example
 * productOf()?.edition?.of; // "commerce"
 */
export function productOf(): Product | null {
  return runwayFacts().product ?? null;
}
