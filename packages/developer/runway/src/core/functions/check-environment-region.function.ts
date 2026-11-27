/**
 * Stackra file contract:
 * Purpose: `checkEnvironmentRegion(root)`, the region check of a product's parsed root runway: its staging and
 *          production each name `region`; every `region` an environment names resolves (`resolveRegion`: a key of
 *          `regions`, a preset `me`, `eu` or `ksa`, or an AWS or Google Cloud region id such as `us-east-1` or
 *          `europe-west1`); an environment that resolves to Google Cloud has a project (`providers.gcp.projects`, or
 *          `providers.gcp.project: true` for figentra/infra to vend one); and an environment in me-central-1 names no
 *          t4g or m6g cache node class, which that region does not offer.
 * Boundary: pure; returns every failure instead of throwing, for `runway validate` to print. A runway without
 *           `product` (Stackra core) is not a product estate and is skipped; an environment it does not declare is too.
 * Runtime: isomorphic
 * Governing contract: ADR 0524 (amendment 2026-11-27, STA-2896: any provider region); OS ADR 0001 (tenant regions);
 *                     STA-2104.
 */
import { RunwayCloud } from "#core/enums/runway-cloud.enum";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { resolveRegion } from "#core/functions/resolve-region.function";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";

/** The cache node families the UAE region does not offer (the cost plan of 2026-11-06). */
const UNOFFERED_IN_ME = /^cache\.(?:t4g|m6g)\./;

/** The AWS region in the UAE. */
const UAE = "me-central-1";

/** The environments a product must place in a region. */
const PLACED = [RunwayEnvironment.Staging, RunwayEnvironment.Production] as const;

/** The three forms a region takes, for the messages. */
const FORMS =
  "a provider region id (us-east-1, ap-south-1, europe-west1), a key of `regions`, or a preset (me, eu, ksa)";

/**
 * Every region failure of a product runway, `[]` when none.
 *
 * @example
 * checkEnvironmentRegion(root);
 * // [{ path: "environments.staging.region", message: "Name the region this environment runs in: …" }]
 */
export function checkEnvironmentRegion(root: RootRunway): RunwayIssue[] {
  if (root.product === undefined) return [];
  const unplaced = PLACED.filter(
    (environment) =>
      root.environments[environment] !== undefined &&
      root.environments[environment]?.region === undefined,
  ).map((environment) => ({
    path: `environments.${environment}.region`,
    message: `Name the region this environment runs in: ${FORMS}`,
  }));
  const placed = Object.entries(root.environments).flatMap(([name, environment]) =>
    environment?.region === undefined
      ? []
      : [{ name, environment, region: resolveRegion(root, environment.region) }],
  );
  const unknown = placed
    .filter(({ region }) => region === undefined)
    .map(({ name, environment }) => ({
      path: `environments.${name}.region`,
      message: `"${environment.region}" is not a region Runway knows: name ${FORMS}`,
    }));
  const gcp = root.providers?.gcp;
  const hasProject = gcp?.project === true || Object.keys(gcp?.projects ?? {}).length > 0;
  const withoutProject = hasProject
    ? []
    : placed
        .filter(({ region }) => region?.cloud === RunwayCloud.Gcp)
        .map(({ name, region }) => ({
          path: `environments.${name}.region`,
          message: `${region?.location} runs in Google Cloud: name the project in \`providers.gcp.projects\`, or set \`providers.gcp.project: true\` for figentra/infra to vend one`,
        }));
  const unofferedCache = placed
    .filter(
      ({ environment, region }) =>
        region?.location === UAE && UNOFFERED_IN_ME.test(environment.shared?.cache?.class ?? ""),
    )
    .map(({ name }) => ({
      path: `environments.${name}.shared.cache.class`,
      message: `${UAE} offers no ElastiCache t4g or m6g nodes: use serverless, an m7g or a t3 class`,
    }));
  return [...unplaced, ...unknown, ...withoutProject, ...unofferedCache];
}
