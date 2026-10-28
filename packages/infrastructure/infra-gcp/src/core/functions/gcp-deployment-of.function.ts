/**
 * Stackra file contract:
 * Purpose: `gcpDeploymentOf(runway, environment, dedicated?)`, one GCP deployment resolved from the narrowed root
 *          runway: the project its runway `cloud` names, its region (its first GCP region in `regions`, else
 *          `providers.gcp.region`), the stack prefix, ownership of the project-wide resources (the first deployment, in
 *          promotion order with dedicated ones after their environment, to name the project) and the cost labels.
 *          Every service account id the programs make is checked against GCP's 30 characters here.
 * Boundary: pure; the config readers (`gcpBaselineConfig`, `gcpRuntimeConfig`) call it and add their own parts.
 *           Names no region or project itself: both are runway data.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 2 to 4), ADR 0400 (`cloud` replaces `providers.gcp.environments`; dedicated
 *                     deployments), ADR 0401 (the service account guard), ADR 0172 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { RunwayEnvironment, RunwayInvalidError } from "@stackra/runway";
import type { RunwayIssue } from "@stackra/runway";

import { ROOT_SOURCE } from "#core/constants/root-source.constant";
import { costLabels } from "#core/functions/cost-labels.function";
import { serviceAccountId } from "#core/functions/service-account-id.function";
import type { GcpDeployment } from "#core/types/gcp-deployment.type";
import type { InfraRunway } from "#core/types/infra-runway.type";

/** The purposes of the service accounts the programs create, each checked against the length limit. */
const PURPOSES = ["infra", "stop"];

/** Throws the root runway refusal carrying `issues`. */
const refuseRunway = (issues: RunwayIssue[]): never => {
  throw new RunwayInvalidError(ROOT_SOURCE, issues);
};

/**
 * The deployment of `environment`, or of its dedicated deployment `dedicated`.
 *
 * @throws RunwayInvalidError when the deployment does not run on GCP, names a project `providers.gcp.projects` lacks,
 *         has no region, or would make a service account id longer than GCP allows.
 * @example
 * gcpDeploymentOf(parseInfraRunway(root), "production").region; // "me-central2" (its `ksa` region)
 */
export function gcpDeploymentOf(
  runway: InfraRunway,
  environment: RunwayEnvironment,
  dedicated?: string,
): GcpDeployment {
  const { gcp } = runway.providers;
  const block = runway.environments[environment];
  const entry = dedicated === undefined ? block : block?.dedicated[dedicated];
  const path =
    dedicated === undefined
      ? `environments.${environment}`
      : `environments.${environment}.dedicated.${dedicated}`;

  if (entry === undefined)
    return refuseRunway([{ path, message: "The root runway has no such deployment" }]);
  const cloud = entry.cloud;
  if (cloud?.name !== "gcp")
    return refuseRunway([
      {
        path: `${path}.cloud`,
        message:
          "This deployment does not run on GCP: set cloud: { name: gcp, account: <project key> }",
      },
    ]);
  const cloudProject = gcp.projects[cloud.account];
  const keys = entry.regions ?? block?.regions ?? [];
  const location = keys
    .map((key) => runway.regions[key])
    .find((region) => region?.cloud === "gcp")?.location;
  const region = location ?? gcp.region;
  const deployment = `${runway.project}-${dedicated ?? environment}`;

  const issues: RunwayIssue[] = [];
  if (cloudProject === undefined)
    issues.push({
      path: `providers.gcp.projects.${cloud.account}`,
      message: `${path}.cloud names "${cloud.account}", which providers.gcp.projects does not list`,
    });
  if (region === undefined)
    issues.push({
      path: "providers.gcp.region",
      message: `${path} lists no GCP region: name one in regions, or set the default region`,
    });
  for (const purpose of PURPOSES)
    try {
      serviceAccountId(deployment, purpose);
    } catch (error) {
      issues.push({ path: "project", message: (error as Error).message });
    }
  if (cloudProject === undefined || region === undefined || issues.length > 0)
    return refuseRunway(issues);

  const owner = Enum.values(RunwayEnvironment)
    .flatMap((name) => {
      const other = runway.environments[name];
      return [
        { name, key: undefined as string | undefined, cloud: other?.cloud },
        ...Object.entries(other?.dedicated ?? {}).map(([key, value]) => ({
          name,
          key,
          cloud: value.cloud,
        })),
      ];
    })
    .find(
      (candidate) => candidate.cloud?.name === "gcp" && candidate.cloud.account === cloud.account,
    );

  const labels = costLabels(runway.project, environment, gcp.requiredLabels);
  const scope = dedicated === undefined ? null : (block?.dedicated[dedicated]?.tenant ?? null);
  return {
    project: runway.project,
    environment,
    deployment,
    dedicated: dedicated === undefined || scope === null ? null : { key: dedicated, scope },
    projectKey: cloud.account,
    cloudProject: { id: cloudProject.id, number: cloudProject.number },
    region,
    ownsProject: owner?.name === environment && owner.key === dedicated,
    labels: scope === null ? labels : { ...labels, tenant: scope },
  };
}
