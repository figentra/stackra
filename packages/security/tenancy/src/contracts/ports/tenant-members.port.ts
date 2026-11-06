/**
 * Stackra file contract:
 * Purpose: the `TenantMembers` client port: the active tenant's members and invitations, for `MembersPage` and a
 *          host's `MemberPicker`: list, invite, change a role, remove, and list and revoke invitations.
 * Boundary: an abstract class that is its own token. An app binds it to its generated client (`membership.list`,
 *           `membership.change_role`, `membership.remove`, `invitation.create`, `invitation.list`,
 *           `invitation.revoke`, STA-1967); the OS backend implements the service side. Every call acts on the active
 *           tenant (`X-Scope-Path`), so none takes a tenant id. A refusal rejects with an error whose `code` is the
 *           refusal's (`last_owner_refused`, `external_role_not_allowed`). `MemoryTenantMembersDriver` in `./testing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0263 (ports and drivers); ADR 0208 (memberships); ADR 0140
 *                     (refusal codes).
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { TenantInvitation } from "#contracts/types/tenant-invitation.type";
import type { TenantMember } from "#contracts/types/tenant-member.type";

/**
 * The active tenant's members and invitations.
 *
 * @example
 * const members = useContainer().get(TenantMembers);
 * const { items, nextCursor } = await members.list({ limit: 20 });
 */
export abstract class TenantMembers extends Port {
  /**
   * A page of the members. The server filters `search` by role only, since tenancy holds no handle; names are
   * filtered on the client over the loaded page.
   */
  abstract list(input: {
    readonly search?: string | undefined;
    readonly kind?: "internal" | "external" | undefined;
    readonly cursor?: string | undefined;
    readonly limit?: number | undefined;
  }): Promise<{ readonly items: readonly TenantMember[]; readonly nextCursor: string | null }>;

  /** Invites `email` to `role`. */
  abstract invite(input: {
    readonly email: string;
    readonly role: string;
    readonly kind: "internal" | "external";
  }): Promise<{ readonly invitationId: PublicId<"inv"> }>;

  /** A page of the invitations, newest first. */
  abstract invitations(input: {
    readonly cursor?: string | undefined;
    readonly limit?: number | undefined;
  }): Promise<{
    readonly items: readonly TenantInvitation[];
    readonly nextCursor: string | null;
    readonly hasMore: boolean;
  }>;

  /** Revokes a pending invitation. */
  abstract revokeInvitation(invitationId: PublicId<"inv">): Promise<void>;

  /** Gives a membership another role. Refuses with `last_owner_refused`, or with `external_role_not_allowed`. */
  abstract changeRole(input: {
    readonly membershipId: PublicId<"mbr">;
    readonly role: string;
  }): Promise<void>;

  /** Ends a membership. Refuses with `last_owner_refused`. */
  abstract remove(membershipId: PublicId<"mbr">): Promise<void>;
}
