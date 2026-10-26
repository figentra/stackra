/**
 * Stackra file contract:
 * Purpose: `SurfaceIssue`, one failure `checkSurfaces` reports for the root runway's `surfaces`, `mobile` and `assets`
 *          blocks: the dotted path, a snake_case code and a message.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (enforcement), ADR 0436 (decisions 3 and 9, enforcement), ADR 0439 (decision 6,
 *                     enforcement), ADR 0231 (snake_case codes).
 */

/** One surface or mobile failure. */
export type SurfaceIssue = {
  /** Dotted path inside the root runway (`surfaces.ops`, `mobile.staff.identity.ios.bundleId`). */
  readonly path: string;
  /**
   * `ops_contributes_only`, `contributes_outside_ops`, `content_outside_landing`, `shell_missing`,
   * `path_outside_assets`, `host_duplicate`, `app_id_pattern`, `app_member_unknown`.
   */
  readonly code:
    | "ops_contributes_only"
    | "contributes_outside_ops"
    | "content_outside_landing"
    | "shell_missing"
    | "path_outside_assets"
    | "host_duplicate"
    | "app_id_pattern"
    | "app_member_unknown";
  /** What is wrong, for `stackra validate` to print. */
  readonly message: string;
};
