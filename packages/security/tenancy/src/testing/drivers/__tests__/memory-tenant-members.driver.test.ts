/**
 * Stackra file contract:
 * Purpose: proves `MemoryTenantMembersDriver` is a `TenantMembers`, pages by its cursor, filters by kind and role,
 *          invites and revokes, changes a role, removes, and refuses as the OS does: the last owner kept, a role that
 *          does not fit the member's kind refused.
 * Boundary: unit tier; the driver alone.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0263; STA-1967.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TenantMembers } from "#contracts/ports/tenant-members.port";
import type { TenantMember } from "#contracts/types/tenant-member.type";
import { ExternalRoleNotAllowedError } from "#core/errors/external-role-not-allowed.error";
import { LastOwnerRefusedError } from "#core/errors/last-owner-refused.error";
import { MemoryTenantMembersDriver } from "#testing/drivers/memory-tenant-members.driver";

/** A member with `role`, keyed by `n`. */
const member = (
  n: number,
  role: string,
  kind: TenantMember["kind"] = "internal",
): TenantMember => ({
  membershipId: `mbr_${String(n).padStart(26, "0")}` as PublicId<"mbr">,
  userId: `usr_${String(n).padStart(26, "0")}` as PublicId<"usr">,
  name: `Person ${n}`,
  role,
  kind,
  state: "active",
});

const OWNER = member(1, "owner");
const STAFF = member(2, "staff");
const PARENT = member(3, "parent", "external");

const driver = () =>
  new MemoryTenantMembersDriver().set({
    members: [OWNER, STAFF, PARENT],
    externalRoles: ["parent"],
  });

describe("MemoryTenantMembersDriver", () => {
  it("is a TenantMembers and pages by its cursor", async () => {
    const members = driver();
    expect(members).toBeInstanceOf(TenantMembers);
    const first = await members.list({ limit: 2 });
    expect(first.items.map((row) => row.membershipId)).toEqual([
      OWNER.membershipId,
      STAFF.membershipId,
    ]);
    expect(first.nextCursor).toBe("2");
    const second = await members.list({ limit: 2, cursor: first.nextCursor ?? undefined });
    expect(second.items).toEqual([PARENT]);
    expect(second.nextCursor).toBeNull();
  });

  it("filters by kind and by role", async () => {
    const members = driver();
    expect((await members.list({ kind: "external" })).items).toEqual([PARENT]);
    expect((await members.list({ search: "staff" })).items).toEqual([STAFF]);
  });

  it("invites, lists the invitation first and revokes it", async () => {
    const members = driver();
    const { invitationId } = await members.invite({
      email: "new@example.com",
      role: "staff",
      kind: "internal",
    });
    const page = await members.invitations({});
    expect(page.items[0]).toMatchObject({ id: invitationId, status: "pending" });
    expect(page.hasMore).toBe(false);
    await members.revokeInvitation(invitationId);
    expect((await members.invitations({})).items[0]?.status).toBe("revoked");
  });

  it("changes a role and removes a member", async () => {
    const members = driver();
    await members.changeRole({ membershipId: STAFF.membershipId, role: "admin" });
    await members.remove(PARENT.membershipId);
    expect((await members.list({})).items).toEqual([OWNER, { ...STAFF, role: "admin" }]);
  });

  it("keeps the last owner", async () => {
    const members = driver();
    await expect(
      members.changeRole({ membershipId: OWNER.membershipId, role: "staff" }),
    ).rejects.toBeInstanceOf(LastOwnerRefusedError);
    await expect(members.remove(OWNER.membershipId)).rejects.toMatchObject({
      code: "last_owner_refused",
    });
  });

  it("refuses a role that does not fit the member's kind", async () => {
    const members = driver();
    await expect(
      members.changeRole({ membershipId: PARENT.membershipId, role: "staff" }),
    ).rejects.toBeInstanceOf(ExternalRoleNotAllowedError);
    await expect(
      members.invite({ email: "x@example.com", role: "parent", kind: "internal" }),
    ).rejects.toMatchObject({ code: "external_role_not_allowed" });
  });
});
