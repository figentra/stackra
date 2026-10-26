/**
 * Stackra file contract:
 * Purpose: `providerFor(target, providers)`, the provider that serves a target's destination.
 * Boundary: internal to `deploy`, `promote` and `rollback`; pure lookup.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3: a new target is a new provider).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployTarget } from "#core/types/deploy-target.type";

/**
 * The provider of `target.destination`.
 *
 * @throws RunwayUnresolvedError when no provider serves the destination.
 */
export function providerFor(
  target: DeployTarget,
  providers: readonly RunwayProvider[],
): RunwayProvider {
  const provider = providers.find((candidate) => candidate.destination === target.destination);
  if (provider === undefined)
    throw new RunwayUnresolvedError(
      `${target.id} deploys to "${target.destination}", which no provider serves`,
    );
  return provider;
}
