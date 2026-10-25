/**
 * Stackra file contract:
 * Purpose: `connectPolicies`, how the booted runtime (gen's entry, or the testing module through iam's testing plugin)
 *          hands IAM the resolver it builds policy instances with, so each policy keeps its constructor dependencies.
 * Boundary: writes the process-wide resolver; a later call replaces it. Until it is called, authorizing a record whose
 *           model has a policy fails (closed), never skipping the policy.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0263); ADR 0328 (decision 5: container classes are never constructed by
 *                     an author); the actions precedent (`connectExtensions`).
 */
import type { Resolver } from "@stackra/actions";

import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";

/**
 * Connects the policies to the booted container.
 *
 * @example
 * const container = await Container.create(wirings);
 * connectPolicies(container);
 */
export function connectPolicies(resolver: Resolver): void {
  POLICY_REGISTRY.resolver = resolver;
}
