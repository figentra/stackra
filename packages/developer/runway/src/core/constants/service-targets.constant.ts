/**
 * Stackra file contract:
 * Purpose: `SERVICE_TARGETS`, the destinations that run a repository's services (`encore-cloud`, `aws-ecs`, `compose`,
 *          `helm`), so a deploy to one ships the services' Postgres migrations; `deployEvidence` and `runway evidence`
 *          judge `destructive` for them from gen's migration classes.
 * Boundary: a frozen set of target names.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */

/** The targets that run services. */
export const SERVICE_TARGETS: ReadonlySet<string> = new Set([
  "encore-cloud",
  "aws-ecs",
  "compose",
  "helm",
]);
