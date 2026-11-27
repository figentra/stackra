/**
 * Stackra file contract:
 * Purpose: `pullRequestPreviewHost(product, pullRequest, zone)`, the one host a product's pull request previews at:
 *          `<product>-pr-<n>.<zone>` (ADR 0289 decision 7 and its 2026-11-09 note).
 * Boundary: pure. One label under the zone, so the zone's wildcard certificate covers it; the product is in the label
 *           because every product repository numbers its pull requests from 1. The zone is the product's
 *           (`environments.preview.domains.pullRequestZone`), a separate registrable domain from production.
 * Runtime: node
 * Governing contract: ADR 0289 (decision 7 and the 2026-11-01 note, STA-1908); STA-2876 (the zone is an input).
 */
/** A product key that can start a DNS label. */
const PRODUCT_LABEL = /^[a-z][a-z0-9-]*$/;
/** A zone: two or more lowercase DNS labels. */
const ZONE = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9]$/;

/**
 * The preview host of `product`'s pull request `pullRequest`.
 *
 * @param zone - the product's pull-request zone (`environments.preview.domains.pullRequestZone`).
 * @throws TypeError when the number is not a positive integer, the product is not a DNS label or the zone is not a
 *         lowercase host name of two labels or more.
 * @example
 * pullRequestPreviewHost("bistro", 412, "preview.example"); // "bistro-pr-412.preview.example"
 */
export function pullRequestPreviewHost(product: string, pullRequest: number, zone: string): string {
  if (!Number.isInteger(pullRequest) || pullRequest < 1)
    throw new TypeError(`A pull request number is a positive integer, not ${pullRequest}`);
  if (!PRODUCT_LABEL.test(product))
    throw new TypeError(`A product key is a lowercase DNS label, not "${product}"`);
  if (!ZONE.test(zone))
    throw new TypeError(
      `A pull-request zone is a lowercase host name such as preview.example, not "${zone}"`,
    );
  return `${product}-pr-${pullRequest}.${zone}`;
}
