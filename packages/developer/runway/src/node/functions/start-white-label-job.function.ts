/**
 * Stackra file contract:
 * Purpose: `startWhiteLabelJob(request)`, the white-label job starter: turns the OS event
 *          `white_label.build.requested.v1` into the mobile job's variant (scope, entitlements, the identity parts the
 *          scope sets) and runs the job for the event's app.
 * Boundary: refuses an event with no scope or app before the job runs; every other check (the app is white-label, the
 *           scope holds `whiteLabel.entitlement`, the store accounts) is the mobile job's. Runs no command itself.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 8: built from data in the OS, started by an event); STA-2074 (os#244).
 */
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { runMobileJob } from "#node/functions/run-mobile-job.function";
import { whiteLabelVariantOf } from "#node/functions/white-label-variant-of.function";
import type { MobileJobResult } from "#node/types/mobile-job-result.type";
import type { WhiteLabelJobRequest } from "#node/types/white-label-job-request.type";

/** The event this starter reads, as the refusals name it. */
const EVENT = "white_label.build.requested.v1";

/**
 * What the mobile job built for the event's scope.
 * @throws RunwayInvalidError when the event names no scope or no app, before the job runs; the mobile job's own
 *         refusals otherwise.
 * @example
 * await startWhiteLabelJob({ event, repository: ".", templateDir, sha, environment: "production", stores });
 */
export async function startWhiteLabelJob(request: WhiteLabelJobRequest): Promise<MobileJobResult> {
  const { event, job = runMobileJob, ...rest } = request;
  const issues: RunwayIssue[] = [];
  if (event.scopeId.trim() === "")
    issues.push({ path: "scopeId", message: "Name the scope the build is for" });
  if (event.app.trim() === "")
    issues.push({ path: "app", message: "Name the app of the root runway's mobile" });
  if (issues.length > 0) throw new RunwayInvalidError(EVENT, issues);
  return job({ ...rest, app: event.app, variant: whiteLabelVariantOf(event) });
}
