/**
 * Stackra file contract:
 * Purpose: `costTags(project, environment, requiredTags)`, the default tags a Pulumi AWS provider stamps on every
 *          resource: the project, the environment, the owning package as `service`, and each required tag key the
 *          runway lists, set to `shared` when the foundation has no better value.
 * Boundary: internal; the foundation's resources serve every member and every scope, so a required key it cannot
 *           fill (any key besides `env`, `project` and `service`) reads `shared`.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 5: every resource carries cost tags).
 */

/** The provider's default tags. */
export function costTags(
  project: string,
  environment: string,
  requiredTags: readonly string[],
): Record<string, string> {
  const known: Record<string, string> = { project, env: environment, service: "infra-aws" };
  return {
    ...Object.fromEntries(requiredTags.map((key) => [key, known[key] ?? "shared"])),
    ...known,
  };
}
