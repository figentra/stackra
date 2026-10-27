/**
 * Stackra file contract:
 * Purpose: unit tests of `StaffPinService` over `MemoryStaffPinStoreDriver`: a PIN of the configured length enrols as a
 *          salted hash; the right PIN switches the staff member in; wrong PINs lock them out after the configured
 *          attempts until the lockout ends; a manager override needs the manager's PIN and the permission.
 * Boundary: test only; a movable clock, the IAM memory policy source, and the lowest allowed hash cost so the test stays
 *           quick.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0361 (decision 8); owner round 3 #15.
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { MemoryPolicySourceDriver, PolicyDecisionPointService } from "@stackra/iam";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { MemoryStaffPinStoreDriver } from "#core/drivers/memory-staff-pin-store.driver";
import { StaffPinLockedError } from "#core/errors/staff-pin-locked.error";
import { StaffPinRejectedError } from "#core/errors/staff-pin-rejected.error";
import { StaffPinService } from "#core/services/staff-pin.service";

/** A clock the test moves. */
class MovableClockDriver extends Driver(Clock) {
  at = new Date("2026-10-25T09:00:00Z");

  now(): Date {
    return new Date(this.at);
  }
}

const TILL = "dev_01j9z3k4m5n6p7q8r9s0t1v2d1";
const CASHIER = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1";
const manager: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2m1",
  realm: Realm.Staff,
};
const ROOT = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2r1", path: "platform" } as const;

describe("StaffPinService", () => {
  let clock: MovableClockDriver;
  let store: MemoryStaffPinStoreDriver;
  let pins: StaffPinService;

  beforeEach(() => {
    clock = new MovableClockDriver();
    store = new MemoryStaffPinStoreDriver();
    const source = new MemoryPolicySourceDriver();
    source.load({
      grants: [{ principal: manager.id, role: "manager", scope: ROOT }],
      roles: { manager: ["sales.sale.refund"] },
    });
    const config = buildConfig(IdentityConfig, {
      values: { pinHashIterations: 100_000, pinMaxAttempts: 3, pinLockoutMinutes: 15 },
    });
    pins = new StaffPinService(config, store, new PolicyDecisionPointService(source, clock), clock);
  });

  it("enrols a salted hash and refuses a PIN outside the rules", async () => {
    await pins.enrol(TILL, CASHIER, "2468");
    const credential = await store.get(TILL, CASHIER);
    expect(credential?.hash).not.toContain("2468");
    expect(credential?.iterations).toBe(100_000);
    await expect(pins.enrol(TILL, CASHIER, "12")).rejects.toThrow(RangeError);
    await expect(pins.enrol(TILL, CASHIER, "12ab")).rejects.toThrow(RangeError);
  });

  it("switches in with the right PIN and locks out after the attempts", async () => {
    await pins.enrol(TILL, CASHIER, "2468");
    expect(await pins.switchTo(TILL, CASHIER, "2468")).toEqual({
      device: TILL,
      staff: CASHIER,
      at: clock.at,
    });
    await expect(pins.switchTo(TILL, CASHIER, "0000")).rejects.toBeInstanceOf(
      StaffPinRejectedError,
    );
    await expect(pins.switchTo(TILL, CASHIER, "0000")).rejects.toBeInstanceOf(
      StaffPinRejectedError,
    );
    await expect(pins.switchTo(TILL, CASHIER, "0000")).rejects.toBeInstanceOf(StaffPinLockedError);
    await expect(pins.switchTo(TILL, CASHIER, "2468")).rejects.toBeInstanceOf(StaffPinLockedError);
    clock.at = new Date("2026-10-25T09:16:00Z");
    await expect(pins.switchTo(TILL, CASHIER, "2468")).resolves.toMatchObject({ staff: CASHIER });
    expect((await store.get(TILL, CASHIER))?.failures).toBe(0);
  });

  it("refuses a staff member with no PIN on the device", async () => {
    await expect(pins.switchTo(TILL, CASHIER, "2468")).rejects.toBeInstanceOf(
      StaffPinRejectedError,
    );
  });

  it("approves an override with the manager's PIN and permission only", async () => {
    await pins.enrol(TILL, manager.id, "1357");
    const override = await pins.override(TILL, manager, "1357", "sales.sale.refund");
    expect(override.manager).toBe(manager.id);
    expect(override.expiresAt.getTime() - override.at.getTime()).toBe(120_000);
    await expect(pins.override(TILL, manager, "1357", "sales.sale.void")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(pins.override(TILL, manager, "9999", "sales.sale.refund")).rejects.toBeInstanceOf(
      StaffPinRejectedError,
    );
  });
});
