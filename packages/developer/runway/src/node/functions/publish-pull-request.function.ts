/**
 * Stackra file contract:
 * Purpose: `publishPullRequest(request, pullRequest)`, `publishProduct`'s path for one pull request's preview: uploads
 *          the console bundle, then writes the one `host:<product>-pr-<n>.figentra.cloud` row and the console's
 *          `release:<product>:console:pr-<n>` row, both with a 7-day expiry. There is no canary (a preview has no
 *          tenants to judge against), no app-link file and no ops review; the router Worker reads these rows.
 * Boundary: every check runs before the first upload or write, including the guard that refuses a host row another
 *           product already holds. The bundle's asset keys are versioned by commit, so a
 *           pull request never overwrites another's bundle. The shared `preview` environment's rows are untouched.
 * Runtime: node
 * Governing contract: ADR 0289 (decision 7, the 2026-11-01 note; STA-1907); ADR 0437 (the KV copy); ADR 0170 (decision 7).
 */
import { join } from "node:path";

import { EdgeKvPrefix } from "@stackra/app/contracts";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import { PULL_REQUEST_PREVIEW_SETTINGS } from "#node/constants/pull-request-preview-settings.constant";
import { bundleSurfaces } from "#node/functions/bundle-surfaces.function";
import { cloudflareAccountEnv } from "#node/functions/cloudflare-account-env.function";
import { pullRequestPreviewHost } from "#node/functions/pull-request-preview-host.function";
import { readBundles } from "#node/functions/read-bundles.function";
import { readRunway } from "#node/functions/read-runway.function";
import { releaseOf } from "#node/functions/release-of.function";
import { runProgram } from "#node/functions/run-program.function";
import { uploadBundle } from "#node/functions/upload-bundle.function";
import type { EdgeHostRow } from "#node/types/edge-host-row.type";
import type { EdgeRelease } from "#node/types/edge-release.type";
import type { ProductPublishRequest } from "#node/types/product-publish-request.type";
import type { ProductPublishResult } from "#node/types/product-publish-result.type";

/**
 * What the preview publish uploaded and wrote.
 *
 * @throws RunwayInvalidError before any upload or write when the environment is not `preview`, the number is not a
 *         pull request's, the product or the region is unknown, another product holds the host, the console ships no bundle or its target is not served.
 * @example
 * await publishProduct({ repository: ".", environment: "preview", pullRequest: 412, kv, assets, served: ["console@3"] });
 */
export async function publishPullRequest(
  request: ProductPublishRequest,
  pullRequest: number,
): Promise<ProductPublishResult> {
  const { surface, ttlSeconds } = PULL_REQUEST_PREVIEW_SETTINGS;
  const root = readRunway(join(request.repository, "runway.yaml"), "root");
  const product = root.product?.key;
  const region = request.region ?? root.environments.preview?.regions?.[0];
  const issues: RunwayIssue[] = [];
  if (product === undefined)
    issues.push({ path: "product.key", message: "Name the product the preview belongs to" });
  if (!Number.isInteger(pullRequest) || pullRequest < 1)
    issues.push({ path: "pullRequest", message: "Name the pull request number" });
  if (request.environment !== RunwayEnvironment.Preview)
    issues.push({
      path: "environment",
      message: `A pull request previews in preview, not ${request.environment}`,
    });
  if (region === undefined)
    issues.push({
      path: "environments.preview.regions",
      message: "Name the region the preview's API calls go to",
    });
  if (!bundleSurfaces(root).includes(surface))
    issues.push({
      path: `surfaces.${surface}`,
      message: `A pull-request preview serves the ${surface} surface, and it ships no bundle`,
    });
  if (issues.length > 0 || product === undefined || region === undefined)
    throw new RunwayInvalidError("runway.yaml", issues);

  const host = pullRequestPreviewHost(product, pullRequest);
  // The host row is shared ground: refuse one another product holds, rather than take its preview over.
  const existing = await request.kv.read(`${EdgeKvPrefix.Host}:${host}`);
  const owner = existing === null ? undefined : (JSON.parse(existing) as EdgeHostRow).product;
  if (owner !== undefined && owner !== product)
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: "product.key",
        message: `${host} serves ${owner}'s preview, not ${product}'s`,
      },
    ]);

  const [bundle] = readBundles(request.repository, [surface]);
  if (bundle === undefined)
    throw new RunwayInvalidError("runway.yaml", [
      { path: `surfaces.${surface}`, message: `No ${surface} bundle was built` },
    ]);
  if (!request.served.includes(bundle.manifest.targets))
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: `surfaces.${surface}`,
        message: `The bundle targets ${bundle.manifest.targets}, which the edge does not serve (${request.served.join(", ") || "none"})`,
      },
    ]);

  // A `ref:` id is the job's to resolve; an unresolved one refuses here, before the first upload (STA-2124).
  const env =
    request.dryRun === true
      ? undefined
      : cloudflareAccountEnv(root.providers?.cloudflare?.accountId);
  const uploaded = await uploadBundle(
    bundle,
    product,
    request.assets.bucket,
    request.run ?? runProgram,
    env,
  );

  const preset = root.surfaces?.[surface]?.preset;
  const hostRow: EdgeHostRow = {
    product,
    surface,
    region,
    status: EDGE_PUBLISH_SETTINGS.hostStatus,
    realm: EDGE_PUBLISH_SETTINGS.realms[surface] ?? preset ?? EDGE_PUBLISH_SETTINGS.defaultRealm,
    canonical: host,
    pullRequest,
    ...(preset === undefined ? {} : { preset }),
  };
  const release = releaseOf(bundle, product, request.assets.origin);
  const written: string[] = [];
  const put = async (key: string, value: unknown): Promise<void> => {
    await request.kv.put(key, JSON.stringify(value), ttlSeconds);
    written.push(key);
  };
  // release first: a failed second put must not leave a live host without a release
  await put(`${EdgeKvPrefix.Release}:${product}:${surface}:pr-${pullRequest}`, release);
  await put(`${EdgeKvPrefix.Host}:${host}`, hostRow);
  const releases: Record<string, EdgeRelease> = { [surface]: release };
  return { product, uploaded, written, releases, canaries: {}, host };
}
