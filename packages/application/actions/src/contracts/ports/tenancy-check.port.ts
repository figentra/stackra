/**
 * Stackra file contract:
 * Purpose: the `TenancyCheck` port: the first step of the pipeline, which refuses a call whose tenant may not act now
 *          (suspended, closed) before anything else runs.
 * Boundary: an abstract class that is its own token, implemented by the package that owns tenant state; this package
 *           names no tenant rule. An app that binds none has no tenant state to check, so the step is skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended: tenancy is the first step).
 */
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Checks the call's tenant.
 *
 * @example
 * export class TenantStatusCheckDriver extends Driver(TenancyCheck) {
 *   async check(call: CallDescriptor): Promise<void> {
 *     if (call.scopeId && (await this.tenants.isSuspended(call.scopeId))) throw TenantSuspendedError.create();
 *   }
 * }
 */
export abstract class TenancyCheck extends Port {
  /** Resolves when the call's tenant may act; rejects with a Refusal otherwise. */
  abstract check(call: CallDescriptor): Promise<void>;
}
