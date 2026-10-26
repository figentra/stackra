/**
 * Stackra file contract:
 * Purpose: `MemoryTenantBillingContactsDriver`, a `TenantBillingContacts` held in memory, for tests and local runs;
 *          `set` names a tenant's contacts.
 * Boundary: process-local; never a production store.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { TenantBillingContacts } from "#core/ports/tenant-billing-contacts.port";
import type { TenantBillingContact } from "#core/types/tenant-billing-contact.type";

/**
 * Billing contacts held in memory.
 *
 * @example
 * const contacts = new MemoryTenantBillingContactsDriver();
 * contacts.set(tenantId, [{ principalId: owner.id }]);
 */
export class MemoryTenantBillingContactsDriver extends Driver(TenantBillingContacts) {
  /** Tenant id to its contacts. */
  private readonly contacts = new Map<PublicId<"scp">, readonly TenantBillingContact[]>();

  /** Replaces the contacts of `tenantId`. */
  set(tenantId: PublicId<"scp">, contacts: readonly TenantBillingContact[]): void {
    this.contacts.set(
      tenantId,
      Object.freeze(contacts.map((contact) => Object.freeze({ ...contact }))),
    );
  }

  /** The contacts of `tenantId`; empty when none are set. */
  of(tenantId: PublicId<"scp">): Promise<readonly TenantBillingContact[]> {
    return Promise.resolve(this.contacts.get(tenantId) ?? []);
  }
}
