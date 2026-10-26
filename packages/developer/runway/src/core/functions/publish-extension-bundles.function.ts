/**
 * Stackra file contract:
 * Purpose: `publishExtensionBundles(root, sha, publisher, options)`, the Runway step that publishes a product's
 *          extension bundles on a merge: one bundle per surface that lists packages, targeting the surface's shell
 *          line, and the ops contribution as a declarations-only bundle that is held until a second reviewer approves.
 * Boundary: describes and publishes; building the bundles is gen's extension-bundle mode, and moving the release
 *           pointer is the edge projector's. Publishes in surface order and stops at the first publisher failure,
 *           which it rethrows; the registry's own refusals (an unserved shell line) arrive that way.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decisions 4, 5 and 9: bundles target a shell line; ops is declarations only and waits
 *                     for a second reviewer), ADR 0441 (decision 3).
 */
import { Enum } from "@stackra/contracts";

import { SurfaceKind } from "#core/enums/surface-kind.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { ExtensionBundlePublisher } from "#core/ports/extension-bundle-publisher.port";
import type { BundlePublishResult } from "#core/types/bundle-publish-result.type";
import type { ExtensionBundle } from "#core/types/extension-bundle.type";
import type { PublishedBundle } from "#core/types/published-bundle.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** The bundles `root` declares, in surface order. */
function bundlesOf(root: RootRunway, sha: string): ExtensionBundle[] {
  const surfaces = root.surfaces ?? {};
  const product = root.product?.key;
  const bundles: ExtensionBundle[] = [];
  for (const surface of Enum.values(SurfaceKind)) {
    const entry = surfaces[surface];
    if (entry === undefined) continue;
    if (product === undefined)
      throw new RunwayUnresolvedError(
        "the root runway declares surfaces but no product: add product.key",
      );
    if (surface === SurfaceKind.Ops) {
      if (entry.contributes !== undefined)
        bundles.push({
          product,
          surface,
          packages: [entry.contributes],
          sha,
          declarationsOnly: true,
        });
      continue;
    }
    if (entry.packages === undefined || entry.packages.length === 0) continue;
    if (entry.shell === undefined)
      throw new RunwayInvalidError("runway.yaml", [
        { path: `surfaces.${surface}.shell`, message: "A bundle names the shell line it targets" },
      ]);
    bundles.push({
      product,
      surface,
      targets: entry.shell,
      packages: entry.packages,
      sha,
      declarationsOnly: false,
    });
  }
  return bundles;
}

/**
 * Publishes every extension bundle of `root` at `sha`.
 *
 * @param root - the parsed root runway.
 * @param sha - the release commit.
 * @param publisher - where bundles are published.
 * @param options.opsApproved - true once a second reviewer approved this release's ops contribution.
 * @throws RunwayUnresolvedError when surfaces are declared without a product.
 * @throws RunwayInvalidError when a surface lists packages but no shell line.
 * @example
 * const { published, held } = await publishExtensionBundles(root, sha, publisher, { opsApproved: false });
 * held[0]?.surface; // "ops", waiting for its reviewer
 */
export async function publishExtensionBundles(
  root: RootRunway,
  sha: string,
  publisher: ExtensionBundlePublisher,
  options: { readonly opsApproved: boolean },
): Promise<BundlePublishResult> {
  const published: PublishedBundle[] = [];
  const held: ExtensionBundle[] = [];
  for (const bundle of bundlesOf(root, sha)) {
    if (bundle.declarationsOnly && !options.opsApproved) held.push(bundle);
    else published.push(await publisher.publish(bundle));
  }
  return { published, held };
}
