/**
 * Stackra file contract:
 * Purpose: the `FlagCheck` port: the flag step of the pipeline, which refuses a call that a feature flag switches off
 *          for this caller.
 * Boundary: an abstract class that is its own token, implemented where flags meet calls (the runtime that wires
 *           `@stackra/feature-flags`); an app that binds none has no flag on a call, so the step is skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: the flag step after entitlement).
 */
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Checks the feature flags on one call.
 *
 * @example
 * export class FeatureFlagCheckDriver extends Driver(FlagCheck) {
 *   async check(call: CallDescriptor): Promise<void> {
 *     if (!(await this.flags.isOn(flagFor(call.key), call.actor))) throw FeatureOffError.create();
 *   }
 * }
 */
export abstract class FlagCheck extends Port {
  /** Resolves when no flag switches the call off for its caller; rejects with a Refusal otherwise. */
  abstract check(call: CallDescriptor): Promise<void>;
}
