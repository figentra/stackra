/**
 * Stackra file contract:
 * Purpose: `TenantMember`, one member of the active tenant as the `TenantMembers` port lists it: the membership, the
 *          person, their role and whether they are staff or an outside member.
 * Boundary: types only. `name` is null until identity's `accounts.user.list@1` lands, or when identity cannot be
 *           reached; the UI then shows the host's "Unnamed member" words. A `handle` joins it once identity ships one.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0208 (memberships); OS ADR 0010 (external members); STA-1967.
 */
import type { PublicId } from "@stackra/contracts";

/** One member of the active tenant. */
export interface TenantMember {
  /** The membership, the key every change names. */
  readonly membershipId: PublicId<"mbr">;
  /** The person. */
  readonly userId: PublicId<"usr">;
  /** The person's name, or null while identity cannot say it. */
  readonly name: string | null;
  /** The role code, such as `admin`; its words are the host's. */
  readonly role: string;
  /** `internal` for staff, `external` for an outside member on a portal role. */
  readonly kind: "internal" | "external";
  /** The membership's state. */
  readonly state: "active" | "external";
}
