/**
 * Stackra file contract:
 * Purpose: `gcpBaselineConfig(root, environment, origins)`, one environment's GCP foundation config from the root
 *          runway: its GCP project (from `providers.gcp.environments`) and whether it owns the project's project-wide
 *          resources, the cost labels, the budget, the files bucket (when a service default puts files or media on the
 *          `s3` disk, which reaches GCS through its S3-compatible endpoint) and the GitHub repository.
 * Boundary: plain data in and out, so gen can write the result as a config file; project ids, numbers, the billing
 *           account and amounts stay `ref:<path>` until the Pulumi program resolves them. Which environment runs on
 *           GCP, in which region and project, is runway data (ADR 0354 decision 4); nothing here names a region. The
 *           app origins come from gen, which knows the app members' hosts.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 1, 3 and 4), ADR 0171 (decisions 1 to 4), ADR 0172 (decision 5 per project),
 *                     ADR 0222 (media direct uploads).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment, RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayIssue } from "@stackra/runway";

import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { costLabels } from "#core/functions/cost-labels.function";
import { parseInfraRunway } from "#core/functions/parse-infra-runway.function";
import type { GcpBaselineConfig } from "#core/types/gcp-baseline-config.type";

/** An origin a browser uploads from: https, a host, an optional port and nothing else. */
const ORIGIN = /^https:\/\/[a-z0-9.-]+(:\d+)?$/;

/**
 * The GCP foundation config of `environment`.
 *
 * @param root - the parsed root runway (`readRunway("runway.yaml", "root")`).
 * @param environment - the environment the Pulumi stack deploys.
 * @param origins - the app origins that upload files straight to the bucket (`https://console.acme.example`).
 * @throws RunwayInvalidError when `providers.gcp` is missing or invalid, the environment runs in no listed project, or
 *         a budget has no billing account or no amount for its project.
 * @throws TypeError when an origin is not `https://<host>[:port]`.
 * @example
 * const config = gcpBaselineConfig(root, "production", ["https://console.acme.example"]);
 * config.cloudProject; // { id: "ref:gcp.projects.prod.id", number: "ref:gcp.projects.prod.number" }
 */
export function gcpBaselineConfig(
  root: RootRunway,
  environment: RunwayEnvironment,
  origins: readonly string[] = [],
): GcpBaselineConfig {
  for (const origin of origins)
    if (!ORIGIN.test(origin))
      throw new TypeError(`${origin} is not an upload origin: expected https://<host>[:port]`);

  const runway = parseInfraRunway(root);
  const { gcp, github } = runway.providers;
  const name = gcp.environments[environment];
  const cloudProject = name === undefined ? undefined : gcp.projects[name];
  if (name === undefined || cloudProject === undefined)
    throw new RunwayInvalidError(ROOT_SOURCE, [
      {
        path: `providers.gcp.environments.${environment}`,
        message:
          name === undefined
            ? "Name the GCP project (a key of providers.gcp.projects) this environment runs in"
            : `providers.gcp.projects has no "${name}"`,
      },
    ]);

  const first = Enum.values(RunwayEnvironment).find((entry) => gcp.environments[entry] === name);
  const issues: RunwayIssue[] = [];

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
      };
  }
  if (issues.length > 0) throw new RunwayInvalidError(ROOT_SOURCE, issues);

  const settings = runway.environments[environment];
  const config = settings?.defaults?.service?.config;
  const onS3 = config?.filesystem?.disk === "s3" || config?.media?.disk === "s3";
  const buckets = settings?.shared?.buckets;

  return {
    project: runway.project,
    environment,
    region: gcp.region,
    cloudProject: { id: cloudProject.id, number: cloudProject.number },
    ownsProject: first === environment,
    labels: costLabels(runway.project, environment, gcp.requiredLabels),
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
  };
}
