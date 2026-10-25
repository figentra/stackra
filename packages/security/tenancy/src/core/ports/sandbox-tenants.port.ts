/**
 * Stackra file contract:
 * Purpose: the `SandboxTenants` port: where the sandboxes of live tenants are kept: register one, list a live
 *          tenant's, read one, and retire one.
 * Boundary: an abstract class that is its own token, kept in `.` beside the `SandboxTenant` type it names. The OS
 *           tenancy service implements it over its table and creates the sandbox's scope node; this package stores and
 *           reads, and `SandboxTenantService` keeps the rules. A retired sandbox stays listed with its `retiredAt`.
 * Runtime: isomorphic
 * Governing contract: ADR 0280 (decision 3); ADR 0210 (decision 8); ADR 0263.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { SandboxTenant } from "#core/types/sandbox-tenant.type";

/**
 * Keeps sandbox tenants.
 *
 * @example
 * const sandboxes = await store.list(acme.id);
 */
export abstract class SandboxTenants extends Port {
  /** Records `sandbox`. */
  abstract save(sandbox: SandboxTenant): Promise<void>;

  /** The sandbox with tenant id `id`, or `undefined`. */
  abstract get(id: PublicId<"scp">): Promise<SandboxTenant | undefined>;

  /** Every sandbox of `live`, retired ones included, oldest first. */
  abstract list(live: PublicId<"scp">): Promise<readonly SandboxTenant[]>;
}
