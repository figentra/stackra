/**
 * Stackra file contract:
 * Purpose: `ShareTargetOptions`, what `handleShareTarget` takes: the in-app page the worker redirects to once the
 *          payload is kept (the share action's path under the request's locale prefix).
 * Boundary: a type only.
 * Runtime: worker
 * Governing contract: ADR 0255 (share target).
 */

/** Where a share lands. */
export interface ShareTargetOptions {
  /** The page path; the worker adds `?shared=<id>`. */
  readonly redirectTo: string;
}
