/**
 * Stackra file contract:
 * Purpose: `MemoryTenantMembersDriver`, a `TenantMembers` held in memory, for tests, the showcase and local runs:
 *          `set` names the members, the invitations, the owner role and the roles an external member may hold; the
 *          calls page by an index cursor and refuse as the OS does (`last_owner_refused`,
 *          `external_role_not_allowed`).
 * Boundary: process-local; never a production store. It acts on one tenant, the way the port acts on the active one.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0266 (memory first); ADR 0269
 *                     (decision 3); STA-1967.
 */
import { Driver } from "@stackra/container";
import { mintPublicId, type PublicId } from "@stackra/contracts";

import { TenantMembers } from "#contracts/ports/tenant-members.port";
import type { TenantInvitation } from "#contracts/types/tenant-invitation.type";
import type { TenantMember } from "#contracts/types/tenant-member.type";
import { ExternalRoleNotAllowedError } from "#core/errors/external-role-not-allowed.error";
import { LastOwnerRefusedError } from "#core/errors/last-owner-refused.error";

/** A page size when the caller names none. */
const DEFAULT_LIMIT = 20;

/** The slice of `rows` after `cursor` (an index), `limit` long, and the cursor of the next slice. */
function pageOf<T>(rows: readonly T[], cursor: string | undefined, limit = DEFAULT_LIMIT) {
  const start = cursor === undefined ? 0 : Number(cursor);
  const end = start + limit;
  return {
    items: rows.slice(start, end),
    nextCursor: end < rows.length ? String(end) : null,
  };
}

/**
 * Members and invitations held in memory.
 *
 * @example
 * const members = new MemoryTenantMembersDriver().set({ members: [owner, staff], externalRoles: ["parent"] });
 */
export class MemoryTenantMembersDriver extends Driver(TenantMembers) {
  /** Each call by name, oldest first, for a test to read. */
  readonly calls: string[] = [];

  /** The members, in list order. */
  private members: TenantMember[] = [];

  /** The invitations, newest first. */
  private sent: TenantInvitation[] = [];

  /** The role a tenant must keep one holder of. */
  private ownerRole = "owner";

  /** The roles an external member may hold; staff may hold none of them. Empty: no rule. */
  private externalRoles: readonly string[] = [];

  /** Replaces what is given; returns this driver. */
  set(state: {
    readonly members?: readonly TenantMember[];
    readonly invitations?: readonly TenantInvitation[];
    readonly ownerRole?: string;
    readonly externalRoles?: readonly string[];
  }): this {
    if (state.members !== undefined) this.members = state.members.map((member) => ({ ...member }));
    if (state.invitations !== undefined) this.sent = state.invitations.map((sent) => ({ ...sent }));
    if (state.ownerRole !== undefined) this.ownerRole = state.ownerRole;
    if (state.externalRoles !== undefined) this.externalRoles = [...state.externalRoles];
    return this;
  }

  list(input: Parameters<TenantMembers["list"]>[0]): ReturnType<TenantMembers["list"]> {
    this.calls.push("list");
    const rows = this.members.filter(
      (member) =>
        (input.kind === undefined || member.kind === input.kind) &&
        (input.search === undefined || member.role.includes(input.search)),
    );
    return Promise.resolve(pageOf(rows, input.cursor, input.limit));
  }

  invite(input: Parameters<TenantMembers["invite"]>[0]): ReturnType<TenantMembers["invite"]> {
    this.calls.push("invite");
    this.refuseRole(input.kind, input.role);
    const now = new Date();
    const invitation: TenantInvitation = {
      id: mintPublicId("inv"),
      email: input.email,
      role: input.role,
      kind: input.kind,
      status: "pending",
      invitedBy: mintPublicId("usr"),
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
    };
    this.sent.unshift(invitation);
    return Promise.resolve({ invitationId: invitation.id });
  }

  invitations(
    input: Parameters<TenantMembers["invitations"]>[0],
  ): ReturnType<TenantMembers["invitations"]> {
    this.calls.push("invitations");
    const page = pageOf(this.sent, input.cursor, input.limit);
    return Promise.resolve({ ...page, hasMore: page.nextCursor !== null });
  }

  revokeInvitation(invitationId: PublicId<"inv">): Promise<void> {
    this.calls.push("revokeInvitation");
    this.sent = this.sent.map((sent) =>
      sent.id === invitationId && sent.status === "pending" ? { ...sent, status: "revoked" } : sent,
    );
    return Promise.resolve();
  }

  changeRole(input: Parameters<TenantMembers["changeRole"]>[0]): Promise<void> {
    this.calls.push("changeRole");
    const member = this.members.find((row) => row.membershipId === input.membershipId);
    if (member === undefined) return Promise.resolve();
    if (input.role !== this.ownerRole) this.refuseLastOwner(member);
    this.refuseRole(member.kind, input.role);
    this.members = this.members.map((row) => (row === member ? { ...row, role: input.role } : row));
    return Promise.resolve();
  }

  remove(membershipId: PublicId<"mbr">): Promise<void> {
    this.calls.push("remove");
    const member = this.members.find((row) => row.membershipId === membershipId);
    if (member === undefined) return Promise.resolve();
    this.refuseLastOwner(member);
    this.members = this.members.filter((row) => row !== member);
    return Promise.resolve();
  }

  /** Throws when `member` is the only holder of the owner role. */
  private refuseLastOwner(member: TenantMember): void {
    const owners = this.members.filter((row) => row.role === this.ownerRole);
    if (member.role === this.ownerRole && owners.length === 1) throw LastOwnerRefusedError.create();
  }

  /** Throws when `role` does not fit a member of `kind` under the external roles rule. */
  private refuseRole(kind: TenantMember["kind"], role: string): void {
    if (this.externalRoles.length === 0) return;
    if ((kind === "external") !== this.externalRoles.includes(role))
      throw ExternalRoleNotAllowedError.create();
  }
}
