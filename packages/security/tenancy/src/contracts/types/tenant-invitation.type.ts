/**
 * Stackra file contract:
 * Purpose: `TenantInvitation`, one invitation to the active tenant as the `TenantMembers` port lists it; it mirrors
 *          the OS `InvitationView`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0208 (memberships); STA-1967.
 */
import type { PublicId } from "@stackra/contracts";

/** One invitation to the active tenant. */
export interface TenantInvitation {
  /** The invitation, the key a revoke names. */
  readonly id: PublicId<"inv">;
  /** Where the invitation went. */
  readonly email: string;
  /** The role code the invitation grants. */
  readonly role: string;
  /** `internal` for staff, `external` for an outside member. */
  readonly kind: "internal" | "external";
  /** Where the invitation stands. */
  readonly status: "pending" | "accepted" | "revoked" | "expired";
  /** Who sent it. */
  readonly invitedBy: PublicId<"usr">;
  /** When it stops working. */
  readonly expiresAt: Date;
  /** When it was sent. */
  readonly createdAt: Date;
}
