/**
 * Stackra file contract:
 * Purpose: `unusedCloudOptIns(root)`, the cloud opt-ins of a parsed root runway that nothing would run in: an AWS
 *          account (`providers.aws.account: true`) with no environment in me or eu, the regions figentra/infra places
 *          in AWS (ADR 0524).
 * Boundary: pure; `runway validate` prints each as a warning and still passes. A GCP project without a ksa
 *           environment is not reported: an AWS environment may use Google services through it (`providers.gcp.apis`).
 * Runtime: isomorphic
 * Governing contract: ADR 0524; STA-2135.
 */
import { RegionKey } from "#core/enums/region-key.enum";
import type { RootRunway } from "#core/types/root-runway.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";

/**
 * Every cloud opt-in of `root` that no environment would use, `[]` when none.
 *
 * @example
 * unusedCloudOptIns(root);
 * // [{ path: "providers.aws.account", message: "No environment is in me or eu, …" }]
 */
export function unusedCloudOptIns(root: RootRunway): RunwayIssue[] {
  const onAws = Object.values(root.environments).some(
    (environment) => environment?.region === RegionKey.Me || environment?.region === RegionKey.Eu,
  );
  return root.providers?.aws?.account === true && !onAws
    ? [
        {
          path: "providers.aws.account",
          message:
            "No environment is in me or eu, so figentra/infra would vend an AWS account nothing runs in",
        },
      ]
    : [];
}
