/**
 * Stackra file contract:
 * Purpose: `deployProduct(request)`, the deploy of a built product to one environment (`stackra deploy --product`):
 *          refuses an environment whose approval the root runway names (`deploy.approval`) unless it was given;
 *          publishes the web surfaces (`publishProduct`: bundles to the asset store, the platform `host:` and
 *          `wellknown:` rows, the release pointer or the canary); lists each landing surface's seed documents; submits
 *          each mobile app's EAS builds to its stores; and writes the deploy manifest.
 *          `surfacesOnly` publishes the web surfaces only, with no store check and no submission (dev and preview);
 *          `mobileOnly` submits the mobile builds only (`stackra deploy --product --mobile-only`). Submission goes
 *          through the `eas` driver to TestFlight and the Play internal track, and holds an Android build back while
 *          Play has no release yet (the first upload is by hand).
 *          A dry run records every upload, KV write and submission instead of making it.
 * Boundary: reads `dist/product/build.json` (from `buildProduct`), so a deploy ships exactly what was built. Writes
 *           through the KV writer and runs `wrangler` and `eas` only. Importing the landing seeds into experience is
 *           not wired yet (no import endpoint): the documents are listed for that step. Store accounts are checked
 *           before anything is submitted.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 and 13); ADR 0437; ADR 0439 (decisions 2 and 7); ADR 0440 (decision 2);
 *                     ADR 0170 (approvals); ADR 0482 (decision 8: the first Play upload).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { buildConfig } from "@stackra/config";

import { RunwayConfig } from "#config/runway.config";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { PRODUCT_BUILD_SETTINGS } from "#node/constants/product-build-settings.constant";
import { DryRunEdgeKvDriver } from "#node/drivers/dry-run-edge-kv.driver";
import { EasProviderDriver } from "#node/drivers/eas-provider.driver";
import { dryRunCommand } from "#node/functions/dry-run-command.function";
import { publishProduct } from "#node/functions/publish-product.function";
import { readRunway } from "#node/functions/read-runway.function";
import { runCommand } from "#node/functions/run-command.function";
import type { ProductBuild } from "#node/types/product-build.type";
import type { ProductDeploy } from "#node/types/product-deploy.type";
import type { ProductDeployRequest } from "#node/types/product-deploy-request.type";
import type { ProductPublishResult } from "#node/types/product-publish-result.type";

/**
 * Deploys the built product.
 *
 * @throws RunwayUnresolvedError when there is no build manifest, or the environment's approval was not given.
 * @throws RunwayInvalidError naming every mobile app without the store accounts its platforms need, and every publish
 *         problem (`publishProduct`'s), before anything is uploaded or written.
 * @example
 * await deployProduct({ repository: ".", environment: "staging", kv, assets, served: ["console@3"], canaryScopes });
 */
export async function deployProduct(request: ProductDeployRequest): Promise<ProductDeploy> {
  const repository = resolve(request.repository);
  const file = join(repository, PRODUCT_BUILD_SETTINGS.manifest);
  if (!existsSync(file))
    throw new RunwayUnresolvedError(
      `No build to deploy: run stackra build --product first (${PRODUCT_BUILD_SETTINGS.manifest})`,
    );
  const build = JSON.parse(readFileSync(file, "utf8")) as ProductBuild;
  const root = readRunway(join(repository, "runway.yaml"), "root");
  const approval = root.environments[request.environment]?.deploy?.approval;
  if (approval !== undefined && request.approved !== true && request.dryRun !== true)
    throw new RunwayUnresolvedError(
      `${request.environment} deploys only after its approval (${approval}): run the deploy in the job behind it and pass --approved`,
    );

  const real = request.run ?? runCommand;
  const run = request.dryRun === true ? dryRunCommand({ head: build.sha }) : real;

  const issues: RunwayIssue[] = [];
  const apps = request.surfacesOnly === true ? [] : Object.keys(build.mobile);
  for (const app of apps) {
    const identity = root.mobile?.[app]?.identity;
    const stores = request.stores?.[app] ?? [];
    const needs = [
      ...(identity?.ios === undefined ? [] : ["app_store"]),
      ...(identity?.android === undefined ? [] : ["google_play"]),
    ];
    for (const store of needs)
      if (!stores.some((account) => account.store === store))
        issues.push({ path: `mobile.${app}.stores`, message: `No account publishes to ${store}` });
  }
  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);

  const kv = request.dryRun === true ? new DryRunEdgeKvDriver() : request.kv;
  if (kv === undefined && request.mobileOnly !== true)
    throw new RunwayUnresolvedError("Name the edge KV namespace the deploy writes to");
  const surfaces: ProductPublishResult =
    request.mobileOnly === true || kv === undefined
      ? { product: build.product, uploaded: [], written: [], releases: {}, canaries: {} }
      : await publishProduct({
          repository,
          environment: request.environment,
          kv,
          assets: request.assets,
          served: request.served,
          ...(request.canaryScopes === undefined ? {} : { canaryScopes: request.canaryScopes }),
          ...(request.firstRelease === undefined ? {} : { firstRelease: request.firstRelease }),
          ...(request.region === undefined ? {} : { region: request.region }),
          ...(request.appLinks === undefined ? {} : { appLinks: request.appLinks }),
          ...(request.review === undefined ? {} : { review: request.review }),
          run,
        });

  const seeds = Object.fromEntries(
    Object.entries(build.surfaces)
      .filter(([, surface]) => surface.content.length > 0)
      .map(([key, surface]) => [key, surface.content]),
  );

  const submitted: Record<string, string[]> = {};
  const held: Record<string, string> = {};
  for (const [app, built] of Object.entries(build.mobile).filter(([key]) => apps.includes(key))) {
    const eas = Object.assign(new EasProviderDriver(buildConfig(RunwayConfig)), {
      projectDir: join(repository, built.dir),
      run,
    });
    // Play takes the first bundle only by hand (ADR 0482 decision 8): hold Android until that upload exists.
    const packageName = root.mobile?.[app]?.identity?.android?.package;
    const firstUpload =
      request.play === undefined || packageName === undefined || request.dryRun === true
        ? true
        : (await request.play.findApp(packageName))?.hasRelease === true;
    submitted[app] = [];
    for (const id of built.buildIds) {
      const platform = await eas.platformOf(id);
      if (!firstUpload && platform === "android") {
        held[app] =
          `${packageName} has no Play release yet: upload ${id} by hand first (stackra mobile onboard lists the steps)`;
        continue;
      }
      await eas.submit(id, "production", platform);
      submitted[app].push(id);
    }
  }

  const deploy: ProductDeploy = {
    product: build.product,
    environment: request.environment,
    sha: build.sha,
    dryRun: request.dryRun === true,
    surfaces,
    seeds,
    submitted,
    ...(Object.keys(held).length === 0 ? {} : { held }),
    planned: "calls" in run ? (run.calls as DeployStep[]) : [],
  };
  const out = join(repository, PRODUCT_BUILD_SETTINGS.deployManifest(request.environment));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(deploy, null, 2)}\n`);
  return deploy;
}
