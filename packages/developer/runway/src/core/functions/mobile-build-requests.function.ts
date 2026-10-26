/**
 * Stackra file contract:
 * Purpose: `mobileBuildRequests(root, sha)`, the build requests a product merge starts: one per `mobile` entry of the
 *          root runway, published under the platform's store accounts.
 * Boundary: pure. A white-label build is started by an OS tenant event instead, whose handler builds its one request
 *           from tenant data; `buildMobileApps` checks both kinds alike.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 2, 4 and 7).
 */
import { AppPublisher } from "#core/enums/app-publisher.enum";
import { MobileBuildTrigger } from "#core/enums/mobile-build-trigger.enum";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { MobileBuildRequest } from "#core/types/mobile-build-request.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * A request per mobile app of `root`.
 *
 * @param root - the parsed root runway.
 * @param sha - the merged commit.
 * @throws RunwayUnresolvedError when mobile apps are declared without a product.
 * @example
 * mobileBuildRequests(root, sha).map((request) => request.app); // ["staff"]
 */
export function mobileBuildRequests(root: RootRunway, sha: string): MobileBuildRequest[] {
  const apps = Object.entries(root.mobile ?? {});
  if (apps.length === 0) return [];
  const product = root.product?.key;
  if (product === undefined)
    throw new RunwayUnresolvedError(
      "the root runway declares mobile apps but no product: add product.key",
    );
  return apps.map(([app, entry]) => ({
    product,
    app,
    entry,
    trigger: MobileBuildTrigger.ProductMerge,
    sha,
    publisher: AppPublisher.Platform,
  }));
}
