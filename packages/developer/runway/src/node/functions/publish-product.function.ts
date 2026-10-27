/**
 * Stackra file contract:
 * Purpose: `publishProduct(request)`, Runway's publish step for one product checkout and one environment: checks the
 *          ops second-reviewer gate, reads every web surface's built bundle and refuses one whose `targets` the edge
 *          does not serve, builds the platform `host:` and `wellknown:` rows, then uploads each bundle to the asset
 *          store and writes the rows, and for each surface either the `release:` pointer (a first release) or the
 *          `canary:` row with the canary scopes (D6), and answers what it wrote.
 * Boundary: every check runs before the first upload or write, so a refused publish changes nothing. Writes through
 *           the `EdgeKvWriter` port and uploads with wrangler only. Bundles upload before any pointer moves. Runway
 *           writes these rows by hand until the OS edge projector exists (app-shells 16.10); the registry manifest
 *           publish (ADR 0109) and the ops release are not here.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 and 10); ADR 0437 (the KV copy); app-shells 4.2, 5.3, 8.3, 15 (points 7
 *                     and 8) and 16 (points 4, 7 and 10); owner decisions D2, D6 and D9; ADR 0289; ADR 0323 and R-59.
 */
import { join } from "node:path";

import { EdgeKvPrefix } from "@stackra/app/contracts";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { bundleSurfaces } from "#node/functions/bundle-surfaces.function";
import { checkOpsReview } from "#node/functions/check-ops-review.function";
import { platformRows } from "#node/functions/platform-rows.function";
import { readBundles } from "#node/functions/read-bundles.function";
import { readRunway } from "#node/functions/read-runway.function";
import { runCommand } from "#node/functions/run-command.function";
import { uploadBundle } from "#node/functions/upload-bundle.function";
import type { EdgeBundle } from "#node/types/edge-bundle.type";
import type { EdgeCanary } from "#node/types/edge-canary.type";
import type { EdgeRelease } from "#node/types/edge-release.type";
import type { ProductPublishRequest } from "#node/types/product-publish-request.type";
import type { ProductPublishResult } from "#node/types/product-publish-result.type";

/** The release row of `bundle` served from `origin`. */
function releaseOf(bundle: EdgeBundle, product: string, origin: string): EdgeRelease {
  const { manifest } = bundle;
  const base = `${origin.replace(/\/+$/, "")}/${product}/${bundle.surface}/${manifest.version}/`;
  return {
    version: manifest.version,
    url: `${base}${manifest.entry}`,
    base,
    targets: manifest.targets,
    modulepreload: manifest.modulepreload.map((file) => `${base}${file}`),
    css: manifest.css.map((file) => `${base}${file}`),
  };
}

/**
 * What the publish uploaded and wrote.
 *
 * @throws RunwayInvalidError before any upload or write when the review, a bundle, a target, a host or a canary
 *         setting is wrong.
 * @example
 * const kv = new WranglerEdgeKvDriver(buildConfig(EdgeKvConfig, { values: { namespaceId } }));
 * const result = await publishProduct({
 *   repository: ".", environment: "production", kv,
 *   assets: { bucket: "figentra-assets", origin: "https://assets.figentra.com" },
 *   served: ["console@3"], canaryScopes: ["scp_internal", "scp_demo"],
 * });
 */
export async function publishProduct(
  request: ProductPublishRequest,
): Promise<ProductPublishResult> {
  const root = readRunway(join(request.repository, "runway.yaml"), "root");
  if (root.surfaces?.ops !== undefined) checkOpsReview(request.review);
  const rows = platformRows(root, request.environment, {
    region: request.region,
    appLinks: request.appLinks,
  });
  const product = root.product?.key as string;
  const bundles = readBundles(request.repository, bundleSurfaces(root));
  const issues: RunwayIssue[] = [];
  for (const bundle of bundles)
    if (!request.served.includes(bundle.manifest.targets))
      issues.push({
        path: `surfaces.${bundle.surface}`,
        message: `The bundle targets ${bundle.manifest.targets}, which the edge does not serve (${request.served.join(", ") || "none"})`,
      });
  const scopes = request.canaryScopes ?? [];
  if (request.firstRelease !== true && bundles.length > 0 && scopes.length === 0)
    issues.push({
      path: "canaryScopes",
      message:
        "Name the internal and demo scopes the release goes to first (D6), or mark a first release",
    });
  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);

  const run = request.run ?? runCommand;
  const uploaded: string[] = [];
  for (const bundle of bundles)
    uploaded.push(...(await uploadBundle(bundle, product, request.assets.bucket, run)));

  const written: string[] = [];
  const put = async (key: string, value: unknown): Promise<void> => {
    await request.kv.put(key, typeof value === "string" ? value : JSON.stringify(value));
    written.push(key);
  };
  for (const [key, value] of Object.entries(rows)) await put(key, value);
  const releases: Record<string, EdgeRelease> = {};
  const canaries: Record<string, EdgeCanary<EdgeRelease>> = {};
  const since = (request.now ?? new Date()).toISOString();
  for (const bundle of bundles) {
    const release = releaseOf(bundle, product, request.assets.origin);
    if (request.firstRelease === true) {
      releases[bundle.surface] = release;
      await put(`${EdgeKvPrefix.Release}:${product}:${bundle.surface}`, release);
    } else {
      const canary = { ...release, scopes: [...scopes], since };
      canaries[bundle.surface] = canary;
      await put(`${EdgeKvPrefix.Canary}:${product}:${bundle.surface}`, canary);
    }
  }
  return { product, uploaded, written, releases, canaries };
}
