/**
 * Stackra file contract:
 * Purpose: the `TenantBillingContacts` port: who a tenant's billing messages go to.
 * Boundary: an abstract class that is its own token. The OS tenancy service implements it over the tenant's billing
 *           settings and roles; notifications and billing read it instead of a delivery setting of their own. Read
 *           only here; which members are billing contacts is the tenant's data, never a rule in this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (ports and drivers); OS notifications SPEC gap 10.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { TenantBillingContact } from "#core/types/tenant-billing-contact.type";

/**
 * Answers a tenant's billing contacts.
 *
 * @example
 * const recipients = await contacts.of(event.tenantId);
 */
export abstract class TenantBillingContacts extends Port {
  /** The billing contacts of `tenantId`, in the tenant's order; empty when it names none. */
  abstract of(tenantId: PublicId<"scp">): Promise<readonly TenantBillingContact[]>;
}
