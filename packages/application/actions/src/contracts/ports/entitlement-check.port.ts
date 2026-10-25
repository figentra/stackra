/**
 * Stackra file contract:
 * Purpose: the `EntitlementCheck` port: the entitlement step of the pipeline, which refuses a call the tenant's plan
 *          does not cover (a feature it lacks, a limit it reached).
 * Boundary: an abstract class that is its own token. `@stackra/entitlements` implements it from the entitlements that
 *           name the call; an app that binds none has no entitlement to check, so the step is skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: entitlement after precondition); ADR 0139 (runtime-gated features).
 */
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Checks the tenant's entitlements for one call.
 *
 * @example
 * export class PlanEntitlementCheckDriver extends Driver(EntitlementCheck) {
 *   async check(call: CallDescriptor): Promise<void> {
 *     for (const entitlement of this.entitlements.for(call.key)) await entitlement.assert(call);
 *   }
 * }
 */
export abstract class EntitlementCheck extends Port {
  /** Resolves when the tenant is entitled to the call; rejects with a Refusal (`entitlement_required`) otherwise. */
  abstract check(call: CallDescriptor): Promise<void>;
}
