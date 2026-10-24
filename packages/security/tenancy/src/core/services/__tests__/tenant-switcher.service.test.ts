/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantSwitcher`: no tenant before memberships; memberships make the first active and its node
 *          the active scope; a refresh keeps the active tenant while it is still a membership (with its new name),
 *          else takes the first, and clears with none; a switch moves the tenant and the scope; a switch to a tenant
 *          the user is not a member of is refused and changes nothing; subscribers hear every change and stop after
 *          unsubscribing; the snapshots are stable between changes.
 * Boundary: test only; the active scope is the scope package's own service.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0210 (decision 3); ADR 0327 (decisions 7 and 8).
 */
import { Service } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { ActiveScopeService } from "@stackra/scope";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TenantMembershipMissingError } from "#core/errors/tenant-membership-missing.error";
import { TenantSwitcher } from "#core/services/tenant-switcher.service";
import type { TenantMembership } from "#core/types/tenant-membership.type";

const ALPHA: TenantMembership = {
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
  path: "platform.acme.alpha",
  name: "Alpha",
  role: "staff",
  roles: ["staff"],
};
const BETA: TenantMembership = {
  tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wb",
  path: "platform.acme.beta",
  name: "Beta",
  role: "admin",
  roles: ["admin", "staff"],
};

/** A switcher over a fresh active scope. */
function setUp() {
  const scope = new ActiveScopeService();
  return { scope, switcher: new TenantSwitcher(scope) };
}

describe(TenantSwitcher, () => {
  it("is a service with no tenant before the memberships arrive", () => {
    const { scope, switcher } = setUp();
    expect(switcher).toBeInstanceOf(Service);
    expect(switcher.current()).toBeNull();
    expect(switcher.memberships()).toEqual([]);
    expect(scope.current()).toBeNull();
  });

  it("makes the first membership active and its node the active scope", () => {
    const { scope, switcher } = setUp();
    switcher.setMemberships([ALPHA, BETA]);
    expect(switcher.memberships()).toEqual([ALPHA, BETA]);
    expect(Object.isFrozen(switcher.memberships())).toBe(true);
    expect(switcher.current()).toBe(ALPHA);
    expect(scope.current()).toEqual({ id: ALPHA.tenantId, path: ALPHA.path });
  });

  it("keeps the active tenant on a refresh while it is still a membership, else takes the first", async () => {
    const { scope, switcher } = setUp();
    switcher.setMemberships([ALPHA, BETA]);
    await switcher.switchTo(BETA.tenantId);
    const renamed = { ...BETA, name: "Beta GmbH" };
    switcher.setMemberships([ALPHA, renamed]);
    expect(switcher.current()).toBe(renamed);
    switcher.setMemberships([ALPHA]);
    expect(switcher.current()).toBe(ALPHA);
    switcher.setMemberships([]);
    expect(switcher.current()).toBeNull();
    expect(scope.current()).toBeNull();
  });

  it("switches the tenant and the scope", async () => {
    const { scope, switcher } = setUp();
    switcher.setMemberships([ALPHA, BETA]);
    await switcher.switchTo(BETA.tenantId);
    expect(switcher.current()).toBe(BETA);
    expect(scope.current()).toEqual({ id: BETA.tenantId, path: BETA.path });
  });

  it("refuses a tenant the user is not a member of and changes nothing", async () => {
    const { scope, switcher } = setUp();
    switcher.setMemberships([ALPHA]);
    const refused = await switcher.switchTo(BETA.tenantId).catch((error: unknown) => error);
    expect(isRefusal(refused, TenantMembershipMissingError)).toBe(true);
    expect(switcher.current()).toBe(ALPHA);
    expect(scope.current()?.id).toBe(ALPHA.tenantId);
  });

  it("tells subscribers about every change until they unsubscribe", async () => {
    const { switcher } = setUp();
    const listener = vi.fn();
    const unsubscribe = switcher.subscribe(listener);
    switcher.setMemberships([ALPHA, BETA]);
    await switcher.switchTo(BETA.tenantId);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    unsubscribe();
    switcher.setMemberships([]);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("returns the same snapshots until a change", () => {
    const { switcher } = setUp();
    switcher.setMemberships([ALPHA]);
    expect(switcher.memberships()).toBe(switcher.memberships());
    expect(switcher.current()).toBe(switcher.current());
  });
});
