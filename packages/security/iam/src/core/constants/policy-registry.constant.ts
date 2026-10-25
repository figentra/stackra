/**
 * Stackra file contract:
 * Purpose: `POLICY_REGISTRY`, every registered policy row by its model class, and the resolver that builds the policy
 *          instances.
 * Boundary: process-wide and internal: `registerPolicies` writes the rows, `connectPolicies` the resolver, and
 *           `IamAccessControlDriver` reads both. A later row for the same model replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0263); ADR 0294 (decision 22); the actions precedent (the extension
 *                     host).
 */
import type { Resolver } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";

import type { PolicyRegistration } from "#core/types/policy-registration.type";

/** The rows by model, and the resolver of the booted container (unset until `connectPolicies`). */
export const POLICY_REGISTRY: {
  readonly rows: Map<AnyClass, PolicyRegistration>;
  resolver: Resolver | undefined;
} = { rows: new Map(), resolver: undefined };
