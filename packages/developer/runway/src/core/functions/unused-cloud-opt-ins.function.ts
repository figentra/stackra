/**
 * Stackra file contract:
 * Purpose: `unusedCloudOptIns(root)`, the cloud opt-ins of a parsed root runway that nothing would run in: an AWS
 *          account (`providers.aws.account: true`) with no environment whose `region` resolves to AWS (`resolveRegion`:
 *          the presets me and eu, an AWS region id, or a `regions` key on aws).
 * Boundary: pure; `runway validate` prints each as a warning and still passes. A GCP project without a Google Cloud
 *           environment is not reported: an AWS environment may use Google services through it (`providers.gcp.apis`).
 * Runtime: isomorphic
 * Governing contract: ADR 0524 (amendment 2026-11-27, STA-2896); STA-2135.
 */
import { RunwayCloud } from "#core/enums/runway-cloud.enum";
import { resolveRegion } from "#core/functions/resolve-region.function";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";

/**
 * Every cloud opt-in of `root` that no environment would use, `[]` when none.
 *
 * @example
 * unusedCloudOptIns(root);
 * // [{ path: "providers.aws.account", message: "No environment runs on AWS, …" }]
 */
export function unusedCloudOptIns(root: RootRunway): RunwayIssue[] {
  const onAws = Object.values(root.environments).some(
    (environment) =>
      environment?.region !== undefined &&
      resolveRegion(root, environment.region)?.cloud === RunwayCloud.Aws,
  );
  return root.providers?.aws?.account === true && !onAws
    ? [
        {
          path: "providers.aws.account",
          message:
            "No environment runs on AWS, so figentra/infra would vend an AWS account nothing runs in",
        },
      ]
    : [];
}
