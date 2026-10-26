/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryTenantBillingContactsDriver`: it is the `TenantBillingContacts` port, answers the
 *          contacts set for a tenant in order, and none for a tenant without any.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; OS notifications SPEC gap 10.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryTenantBillingContactsDriver } from "#core/drivers/memory-tenant-billing-contacts.driver";
import { TenantBillingContacts } from "#core/ports/tenant-billing-contacts.port";

const ACME = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";
const OTHER = "scp_01j9z3k4m5n6p7q8r9s0t1v2wb";

describe(MemoryTenantBillingContactsDriver, () => {
  it("answers a tenant's contacts in order, and none for another tenant", async () => {
    const contacts = new MemoryTenantBillingContactsDriver();
    expect(contacts).toBeInstanceOf(TenantBillingContacts);
    contacts.set(ACME, [
      { principalId: "usr_01j9z3k4m5n6p7q8r9s0t1v2wa" },
      { email: "ap@acme.test" },
    ]);
    await expect(contacts.of(ACME)).resolves.toEqual([
      { principalId: "usr_01j9z3k4m5n6p7q8r9s0t1v2wa" },
      { email: "ap@acme.test" },
    ]);
    await expect(contacts.of(OTHER)).resolves.toEqual([]);
  });
});
