/**
 * Stackra file contract:
 * Purpose: `TenantBillingContact`, one person a tenant's billing messages go to (a failed renewal, an invoice).
 * Boundary: a type only. A member is named by `principalId`; an outside address (an accountant without an account) by
 *           `email`; at least one is set. Personal data: read to send, never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0239; OS notifications SPEC gap 10.
 */
import type { PublicId } from "@stackra/contracts";

/** One billing contact of a tenant. */
export interface TenantBillingContact {
  /** The member's user id, when the contact has an account. */
  readonly principalId?: PublicId<"usr">;

  /** The address to write to, when the contact has no account or prefers another. */
  readonly email?: string;
}
