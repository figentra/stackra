/**
 * Stackra file contract:
 * Purpose: `gcpBaselineConfig(root, environment, origins, dedicated?)`, one deployment's GCP foundation config from the
 *          root runway: the deployment (`gcpDeploymentOf`: the project its runway `cloud` names, its region, its stack
 *          prefix, ownership and labels), the budget and its non-production spend stop, the files bucket (when a
 *          service default puts files or media on the `s3` disk, which reaches GCS through its S3-compatible endpoint),
 *          the GitHub repository, and the Encore Cloud service account when the environment's services deploy to
 *          `encore-cloud`.
 * Boundary: plain data in and out, so gen can write the result as a config file; project ids, numbers, the billing
 *           account and amounts stay `ref:<path>` until the Pulumi program resolves them. Nothing here names a region
 *           or project (ADR 0354 decision 4). The app origins come from gen, which knows the app members' hosts.
 *           Spend never stops in a project production runs in: a detached billing account stops production too.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 1, 3 and 4), ADR 0171 (decisions 1 to 4), ADR 0172 (decision 5 per project),
 *                     ADR 0222 (media direct uploads), ADR 0400, ADR 0401 (the spend stop), ADR 0435 (Encore roles).
 */
import { RunwayEnvironment, RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayIssue } from "@stackra/runway";

import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { gcpDeploymentOf } from "#core/functions/gcp-deployment-of.function";
import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";
import type { GcpBaselineConfig } from "#core/types/gcp-baseline-config.type";

/** The services destination whose deployments Encore Cloud provisions in the project. */
const ENCORE_CLOUD = "encore-cloud";

/** An origin a browser uploads from: https, a host, an optional port and nothing else. */
const ORIGIN = /^https:\/\/[a-z0-9.-]+(:\d+)?$/;

/**
 * The GCP foundation config of `environment`, or of its dedicated deployment `dedicated`.
 *
 * @param root - the parsed root runway (`readRunway("runway.yaml", "root")`).
 * @param environment - the environment the Pulumi stack deploys.
 * @param origins - the app origins that upload files straight to the bucket (`https://console.acme.example`).
 * @param dedicated - the key of a dedicated deployment of `environment`.
 * @throws RunwayInvalidError when `providers.gcp` is missing or invalid, the deployment does not run on a listed GCP
 *         project, or a budget has no billing account or no amount for its project.
 * @throws TypeError when an origin is not `https://<host>[:port]`.
 * @example
 * const config = gcpBaselineConfig(root, "production", ["https://console.acme.example"]);
 * config.cloudProject; // { id: "ref:gcp.projects.prod.id", number: "ref:gcp.projects.prod.number" }
 */
export function gcpBaselineConfig(
  root: RootRunway,
  environment: RunwayEnvironment,
  origins: readonly string[] = [],
  dedicated?: string,
): GcpBaselineConfig {
  for (const origin of origins)
    if (!ORIGIN.test(origin))
      throw new TypeError(`${origin} is not an upload origin: expected https://<host>[:port]`);

  const runway = parseInfraRunway(root);
  const deployment = gcpDeploymentOf(runway, environment, dedicated);
  const { gcp, github } = runway.providers;
  const settings = runway.environments[environment];
  const name = deployment.projectKey;
  const issues: RunwayIssue[] = [];

  const live = runway.environments[RunwayEnvironment.Production];
  const production = [
    live?.cloud,
    ...Object.values(live?.dedicated ?? {}).map((entry) => entry.cloud),
  ].some((cloud) => cloud?.name === "gcp" && cloud.account === name);

  let budgets: GcpBaselineConfig["budgets"] = null;
  if (gcp.budgets !== undefined) {
    const amount = gcp.budgets.monthly[name];
    if (amount === undefined)
      issues.push({
        path: `providers.gcp.budgets.monthly.${name}`,
        message: `Set the monthly budget of the "${name}" project`,
      });
    if (gcp.billingAccount === undefined)
      issues.push({
        path: "providers.gcp.billingAccount",
        message: "A budget lives on a billing account: name it (a ref:<path> value)",
      });
    if (amount !== undefined && gcp.billingAccount !== undefined)
      budgets = {
        billingAccount: gcp.billingAccount,
        currency: gcp.budgets.currency,
        amount: String(amount),
        thresholds: gcp.budgets.thresholds,
        stopAt: production ? null : (gcp.budgets.stopNonProdAt ?? null),
      };
  }
  if (issues.length > 0) throw new RunwayInvalidError(ROOT_SOURCE, issues);

  const config = settings?.defaults?.service?.config;
  const onS3 = config?.filesystem?.disk === "s3" || config?.media?.disk === "s3";
  const buckets = settings?.shared?.buckets;

  return {
    ...deployment,
    budgets,
    files: onS3
      ? {
          versioning: buckets?.versioning ?? true,
          expireNoncurrentDays: buckets?.lifecycle?.expireNoncurrentDays ?? null,
          origins: [...origins],
        }
      : null,
    github:
      github?.org !== undefined && github.repo !== undefined
        ? { org: github.org, repo: github.repo }
        : null,
    encore:
      gcp.encore !== undefined && settings?.destinations?.["services"] === ENCORE_CLOUD
        ? { serviceAccount: gcp.encore.serviceAccount }
        : null,
  };
}
