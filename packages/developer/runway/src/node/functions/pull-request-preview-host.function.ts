/**
 * Stackra file contract:
 * Purpose: `pullRequestPreviewHost(pullRequest)`, the one host a pull request's preview lives at:
 *          `pr-<n>.figentra.cloud` (ADR 0289 decision 7).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0289 (decision 7 and the 2026-11-01 note, STA-1908).
 */
import { PULL_REQUEST_PREVIEW_SETTINGS } from "#node/constants/pull-request-preview-settings.constant";

/**
 * The preview host of pull request `pullRequest`.
 *
 * @throws TypeError when it is not a positive integer.
 * @example
 * pullRequestPreviewHost(412); // "pr-412.figentra.cloud"
 */
export function pullRequestPreviewHost(pullRequest: number): string {
  if (!Number.isInteger(pullRequest) || pullRequest < 1)
    throw new TypeError(`A pull request number is a positive integer, not ${pullRequest}`);
  return `pr-${pullRequest}.${PULL_REQUEST_PREVIEW_SETTINGS.zone}`;
}
