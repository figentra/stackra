/**
 * Stackra file contract:
 * Purpose: `costLabels(project, environment, requiredLabels)`, the default labels a Pulumi GCP provider stamps on every
 *          resource that takes labels: the project, the environment, the owning package as `service`, and each
 *          required label key the runway lists, set to `shared` when the foundation has no better value.
 * Boundary: internal; the GCP twin of infra-aws's cost tags. The runway project and environment names are already
 *           lower case, so they are valid label values as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 5: every resource carries cost tags, per ADR 0354 also on GCP).
 */

/** The provider's default labels. */
export function costLabels(
  project: string,
  environment: string,
  requiredLabels: readonly string[],
): Record<string, string> {
  const known: Record<string, string> = { project, env: environment, service: "infra-gcp" };
  return {
    ...Object.fromEntries(requiredLabels.map((key) => [key, known[key] ?? "shared"])),
    ...known,
  };
}
