/**
 * Stackra file contract:
 * Purpose: `checkOpsReview(review, reviewers?)`, the second-reviewer gate for ops contributions: passes when people
 *          other than the author approved the change, at least `reviewers` of them (`EDGE_PUBLISH_SETTINGS.opsReviewers`
 *          by default).
 * Boundary: pure; counts the review the deploy workflow read from the pull request. Handles compare
 *           case-insensitively; the author's own approval and duplicates never count.
 * Runtime: node
 * Governing contract: app-shells 16 (point 7: every ops contribution passes a second-reviewer gate in Runway);
 *                     owner decision D1 (one ops console).
 */
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import type { OpsReview } from "#node/types/ops-review.type";

/**
 * Throws unless enough second reviewers approved.
 *
 * @throws RunwayInvalidError when the review is missing or too few people besides the author approved.
 * @example
 * checkOpsReview({ author: "dana", approvals: ["sam"] });
 */
export function checkOpsReview(
  review: OpsReview | undefined,
  reviewers: number = EDGE_PUBLISH_SETTINGS.opsReviewers,
): void {
  const author = review?.author.toLowerCase();
  const others = new Set(
    (review?.approvals ?? [])
      .map((handle) => handle.toLowerCase())
      .filter((handle) => handle !== author),
  );
  if (review === undefined || others.size < reviewers)
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: "surfaces.ops",
        message: `An ops contribution needs ${reviewers} approval(s) besides the author's; it has ${others.size}`,
      },
    ]);
}
