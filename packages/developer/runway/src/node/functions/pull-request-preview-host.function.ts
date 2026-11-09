/**
 * Stackra file contract:
 * Purpose: `pullRequestPreviewHost(product, pullRequest)`, the one host a product's pull request previews at:
 *          `<product>-pr-<n>.figentra.cloud` (ADR 0289 decision 7 and its 2026-11-09 note).
 * Boundary: pure. One label under the zone, so the `*.figentra.cloud` wildcard certificate covers it; the product is
 *           in the label because every product repository numbers its pull requests from 1.
 * Runtime: node
 * Governing contract: ADR 0289 (decision 7 and the 2026-11-01 note, STA-1908).
 */
import { PULL_REQUEST_PREVIEW_SETTINGS } from "#node/constants/pull-request-preview-settings.constant";

/** A product key that can start a DNS label. */
const PRODUCT_LABEL = /^[a-z][a-z0-9-]*$/;

/**
 * The preview host of `product`'s pull request `pullRequest`.
 *
 * @throws TypeError when the number is not a positive integer or the product is not a DNS label.
 * @example
 * pullRequestPreviewHost("mezzora", 412); // "mezzora-pr-412.figentra.cloud"
 */
export function pullRequestPreviewHost(product: string, pullRequest: number): string {
  if (!Number.isInteger(pullRequest) || pullRequest < 1)
    throw new TypeError(`A pull request number is a positive integer, not ${pullRequest}`);
  if (!PRODUCT_LABEL.test(product))
    throw new TypeError(`A product key is a lowercase DNS label, not "${product}"`);
  return `${product}-pr-${pullRequest}.${PULL_REQUEST_PREVIEW_SETTINGS.zone}`;
}
