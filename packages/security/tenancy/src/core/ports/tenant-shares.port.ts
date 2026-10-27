/**
 * Stackra file contract:
 * Purpose: the `TenantShares` port: where cross-tenant shares are kept: save one, read one, list a tenant's.
 * Boundary: an abstract class that is its own token, kept in `.` beside `TenantShare`. The OS tenancy service
 *           implements it over its share table with its audit trail (ADR 0343 decision 1); `TenantShareService` keeps
 *           the rules and is the only writer.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decision 1); ADR 0263.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { TenantShare } from "#core/types/tenant-share.type";

/**
 * Keeps cross-tenant shares: saves one, reads one, lists a tenant's.
 *
 * @example
 * const shares = await store.list(acme.id);
 */
export abstract class TenantShares extends Port {
  /** Records `share`, replacing the one with its id. */
  abstract save(share: TenantShare): Promise<void>;

  /** The share `id`, or `undefined`. */
  abstract get(id: PublicId<"shr">): Promise<TenantShare | undefined>;

  /** Every share `tenant` proposed or receives. */
  abstract list(tenant: PublicId<"scp">): Promise<readonly TenantShare[]>;
}
