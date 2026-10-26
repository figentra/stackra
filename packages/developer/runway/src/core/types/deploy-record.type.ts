/**
 * Stackra file contract:
 * Purpose: `DeployRecord`, what one apply or rollback leaves behind: the target, the commit it shipped and the
 *          provider's own reference to the result (a commit, a build id, an update group), so a later rollback can
 *          return to it.
 * Boundary: type only; the caller writes it to the release records (GitHub Deployments, Linear, Slack: ADR 0352
 *           decision 7) and hands earlier records back to `rollback`. Plain data, no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decisions 3 and 7), ADR 0170 (decision 10).
 */

/** One deploy's record. */
export interface DeployRecord {
  /** The `DeployTarget.id` it landed on. */
  readonly target: string;

  /** The commit SHA it shipped. */
  readonly sha: string;

  /** The provider's reference to what it made. */
  readonly reference: string;
}
