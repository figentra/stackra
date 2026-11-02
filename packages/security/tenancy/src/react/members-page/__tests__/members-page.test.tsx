/**
 * Stackra file contract:
 * Purpose: proves the web MembersPage lists the members (the host's "Unnamed member" words for a null name, each role
 *          by the host's name) and the invitations (each status by the host's word) in named tables, changes a role
 *          through the row's labelled choice, removes a member after a confirmation, shows the host's words in an
 *          alert for `last_owner_refused` and `external_role_not_allowed`, invites through the dialog and reports
 *          it, revokes a pending invitation, and keeps a name in its own direction under `dir="rtl"`.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and the `MemoryTenantMembersDriver` of `./testing`
 *           bound in a container. jsdom has no IntersectionObserver nor layout, which the tables' load-more sentinel
 *           and the menus' scrolling need, so both get stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0260; ADR 0208; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { TenantMembers } from "#contracts/ports/tenant-members.port";
import type { TenantInvitation } from "#contracts/types/tenant-invitation.type";
import type { TenantMember } from "#contracts/types/tenant-member.type";
import { MembersPage } from "#react/members-page/members-page";
import { MemoryTenantMembersDriver } from "#testing/drivers/memory-tenant-members.driver";

/** A member with `role`, keyed by `n`. */
const member = (
  n: number,
  name: string | null,
  role: string,
  kind: TenantMember["kind"] = "internal",
): TenantMember => ({
  membershipId: `mbr_${String(n).padStart(26, "0")}` as PublicId<"mbr">,
  userId: `usr_${String(n).padStart(26, "0")}` as PublicId<"usr">,
  name,
  role,
  kind,
  state: "active",
});

const OWNER = member(1, "Ada Lovelace", "owner");
const STAFF = member(2, null, "staff");
const PARENT = member(3, "Grace Hopper", "parent", "external");

const PENDING: TenantInvitation = {
  id: "inv_00000000000000000000000001" as PublicId<"inv">,
  email: "alan@example.com",
  role: "staff",
  kind: "internal",
  status: "pending",
  invitedBy: OWNER.userId,
  expiresAt: new Date("2026-12-01T00:00:00Z"),
  createdAt: new Date("2026-11-01T00:00:00Z"),
};

const ROLES = [
  { id: "owner", label: "Owner" },
  { id: "admin", label: "Admin" },
  { id: "staff", label: "Staff member" },
  { id: "parent", label: "Parent" },
];

const LABELS = {
  title: "Members",
  members: "Members list",
  loadingMembers: "Loading members",
  noMembers: "No members yet",
  name: "Name",
  unnamedMember: "Unnamed member",
  role: "Role",
  kind: "Type",
  internal: "Staff",
  external: "External",
  actions: "Actions",
  remove: "Remove",
  removeTitle: "Remove this member?",
  removeConfirm: "Remove member",
  cancel: "Cancel",
  invite: "Invite",
  inviteTitle: "Invite a member",
  email: "Email",
  invitations: "Invitations",
  loadingInvitations: "Loading invitations",
  noInvitations: "No invitations",
  status: "Status",
  statuses: { pending: "Pending", accepted: "Accepted", revoked: "Revoked", expired: "Expired" },
  revoke: "Revoke",
  loadFailed: "This list could not be loaded.",
  retry: "Try again",
  lastOwner: "Name another owner first.",
  externalRole: "That role is not for outside members.",
  failed: "The change could not be made.",
};

/** A container binding a members driver over the fixtures, and a wrapper that provides it. */
async function setUp(members: readonly TenantMember[] = [OWNER, STAFF, PARENT]) {
  const driver = new MemoryTenantMembersDriver().set({
    members,
    invitations: [PENDING],
    externalRoles: ["parent"],
  });
  const container = await Container.create([], {
    overrides: new Map([[TenantMembers, driver]]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { driver, wrap };
}

/** The row of the members table that names `name`. */
const memberRow = async (name: string) =>
  (await screen.findByRole("rowheader", { name })).closest("[role='row']") as HTMLElement;

/** Opens the role choice of `name`'s row and picks `role`. */
async function pickRole(name: string, role: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Role: ${name}`) }));
  const option = await screen.findByRole("option", { name: role });
  await act(async () => {
    fireEvent.click(option);
  });
}

describe("MembersPage (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });

  it("lists the members and invitations in named tables with the host's words", async () => {
    const { wrap } = await setUp();
    render(wrap(<MembersPage roles={ROLES} labels={LABELS} />));
    expect(screen.getByRole("grid", { name: "Members list" })).toBeTruthy();
    expect(screen.getByRole("grid", { name: "Invitations" })).toBeTruthy();
    expect(await memberRow("Unnamed member")).toBeTruthy();
    const invitation = (await screen.findByRole("rowheader", { name: "alan@example.com" })).closest(
      "[role='row']",
    ) as HTMLElement;
    expect(within(invitation).getByText("Staff member")).toBeTruthy();
    expect(within(invitation).getByText("Pending")).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Type" })).toBeNull();
  });

  it("shows each member's kind when outside members are allowed", async () => {
    const { wrap } = await setUp();
    render(wrap(<MembersPage roles={ROLES} allowExternal labels={LABELS} />));
    const grace = await memberRow("Grace Hopper");
    expect(screen.getByRole("columnheader", { name: "Type" })).toBeTruthy();
    expect(within(grace).getByText("External")).toBeTruthy();
  });

  it("changes a role through the row's labelled choice", async () => {
    const { driver, wrap } = await setUp();
    render(wrap(<MembersPage roles={ROLES} labels={LABELS} />));
    await memberRow("Unnamed member");
    await pickRole("Unnamed member", "Admin");
    await waitFor(() => expect(driver.calls).toContain("changeRole"));
    expect((await driver.list({})).items.find((row) => row.name === null)?.role).toBe("admin");
  });

  it("shows the host's words when a role does not fit an outside member", async () => {
    const { wrap } = await setUp();
    render(wrap(<MembersPage roles={ROLES} labels={LABELS} />));
    await memberRow("Grace Hopper");
    await pickRole("Grace Hopper", "Admin");
    expect((await screen.findByRole("alert")).textContent).toContain(LABELS.externalRole);
  });

  it("removes a member after a confirmation, and keeps the last owner", async () => {
    const { driver, wrap } = await setUp();
    render(wrap(<MembersPage roles={ROLES} labels={LABELS} />));
    await memberRow("Ada Lovelace");
    fireEvent.click(screen.getByRole("button", { name: "Remove: Ada Lovelace" }));
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: "Remove member" }));
    });
    expect((await screen.findByRole("alert")).textContent).toContain(LABELS.lastOwner);
    expect(screen.getByRole("rowheader", { name: "Ada Lovelace" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Remove: Grace Hopper" }));
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: "Remove member" }));
    });
    await waitFor(() =>
      expect(screen.queryByRole("rowheader", { name: "Grace Hopper" })).toBeNull(),
    );
    expect(driver.calls.filter((call) => call === "remove")).toHaveLength(2);
  });

  it("invites through the dialog, reports it and lists the invitation", async () => {
    const { wrap } = await setUp();
    const onInvited = vi.fn();
    render(
      wrap(
        <MembersPage roles={ROLES} inviteRoles={["staff"]} onInvited={onInvited} labels={LABELS} />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Invite" }));
    const dialog = await screen.findByRole("dialog", { name: "Invite a member" });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /Email/ }), {
      target: { value: "linus@example.com" },
    });
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Invite" }));
    });
    await waitFor(() => expect(onInvited).toHaveBeenCalledWith(expect.stringMatching(/^inv_/)));
    expect(await screen.findByRole("rowheader", { name: "linus@example.com" })).toBeTruthy();
  });

  it("revokes a pending invitation", async () => {
    const { wrap } = await setUp();
    render(wrap(<MembersPage roles={ROLES} labels={LABELS} />));
    const revoke = await screen.findByRole("button", { name: "Revoke: alan@example.com" });
    await act(async () => {
      fireEvent.click(revoke);
    });
    expect(await screen.findByText("Revoked")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Revoke: alan@example.com" })).toBeNull();
  });

  it("keeps a name in its own direction under right-to-left", async () => {
    const { wrap } = await setUp([member(4, "سارة أحمد", "owner")]);
    render(wrap(<MembersPage roles={ROLES} labels={{ ...LABELS, title: "الأعضاء" }} />, "rtl"));
    const name = await screen.findByText("سارة أحمد");
    expect(name.getAttribute("dir")).toBe("auto");
    expect(screen.getByRole("heading", { name: "الأعضاء" }).closest("[dir='rtl']")).toBeTruthy();
  });
});
