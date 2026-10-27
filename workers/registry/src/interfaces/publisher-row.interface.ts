/**
 * Stackra file contract:
 * Purpose: `PublisherRow`: A `publishers` row: the trusted publisher of a scope.
 * Boundary: types only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 3).
 */

/** A `publishers` row: the trusted publisher of a scope. */
export interface PublisherRow {
  /** The scope this publisher may publish to. */
  readonly scope: string;
  /** The `owner/repo` name the workflow must run in. */
  readonly repository: string;
  /** The numeric repository id the token must carry, so a renamed repository cannot take over. */
  readonly repository_id: string;
  /** The numeric owner id the token must carry, so a renamed owner cannot take over. */
  readonly repository_owner_id: string;
  /** The workflow file path the token's `workflow_ref` must name. */
  readonly workflow: string;
  /** The git ref the workflow must run on. */
  readonly ref: string;
  /** The GitHub deployment environment the job must use. */
  readonly environment: string;
}
