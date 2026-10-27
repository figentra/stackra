/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAppApprovalChallengesDriver`: a written challenge reads back by id and by QR token
 *          hash; the pending list holds the principal's live pending ones, newest first; the counts filter by device,
 *          target and time; expiry marks only lapsed pending ones; and devices bind and unbind per principal.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1304.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { AppApprovalPurpose, AppApprovalStatus } from "#contracts/index";
import type { AppApprovalChallenge } from "#contracts/index";
import { MemoryAppApprovalChallengesDriver } from "#core/drivers/memory-app-approval-challenges.driver";

const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const OTHER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4";
const T0 = new Date("2026-10-27T09:00:00Z");

/** A pending challenge for `USER` from `laptop`, created at `T0`, plus `overrides`. */
function challenge(overrides: Partial<AppApprovalChallenge> = {}): AppApprovalChallenge {
  return {
    id: "c1",
    purpose: AppApprovalPurpose.SignIn,
    requester: { device: "laptop", ip: "203.0.113.7", userAgent: "Firefox" },
    target: "rana@acme.example",
    principal: USER,
    number: 47,
    choices: [12, 47, 88, 30],
    pollHash: "p",
    tokenHash: "t1",
    scanned: false,
    status: AppApprovalStatus.Pending,
    createdAt: T0,
    expiresAt: new Date(T0.getTime() + 60_000),
    ...overrides,
  };
}

describe("MemoryAppApprovalChallengesDriver", () => {
  let store: MemoryAppApprovalChallengesDriver;

  beforeEach(() => {
    store = new MemoryAppApprovalChallengesDriver();
  });

  it("reads a challenge back by id and by token hash", async () => {
    await store.put(challenge());
    expect((await store.get("c1"))?.number).toBe(47);
    expect((await store.byToken("t1"))?.id).toBe("c1");
    expect(await store.get("nope")).toBeUndefined();
    expect(await store.byToken("nope")).toBeUndefined();
  });

  it("lists the principal's live pending challenges, newest first", async () => {
    await store.put(challenge());
    await store.put(
      challenge({ id: "c2", tokenHash: "t2", createdAt: new Date(T0.getTime() + 1000) }),
    );
    await store.put(challenge({ id: "c3", tokenHash: "t3", status: AppApprovalStatus.Denied }));
    await store.put(challenge({ id: "c4", tokenHash: "t4", principal: OTHER }));
    expect((await store.pending(USER, T0)).map((each) => each.id)).toEqual(["c2", "c1"]);
    expect(await store.pending(USER, new Date(T0.getTime() + 61_000))).toEqual([]);
  });

  it("counts by device, by target and by time", async () => {
    await store.put(challenge());
    await store.put(
      challenge({ id: "c2", target: "x", requester: { device: "phone", ip: "", userAgent: "" } }),
    );
    expect(await store.countSince({ device: "laptop" }, T0)).toBe(1);
    expect(await store.countSince({ target: "rana@acme.example" }, T0)).toBe(1);
    expect(await store.countSince({}, T0)).toBe(2);
    expect(await store.countSince({}, new Date(T0.getTime() + 1))).toBe(0);
  });

  it("expires only the lapsed pending challenges", async () => {
    await store.put(challenge());
    await store.put(challenge({ id: "c2", status: AppApprovalStatus.Approved }));
    await store.put(challenge({ id: "c3", expiresAt: new Date(T0.getTime() + 600_000) }));
    expect(await store.expire(new Date(T0.getTime() + 60_000))).toBe(1);
    expect((await store.get("c1"))?.status).toBe(AppApprovalStatus.Expired);
    expect((await store.get("c2"))?.status).toBe(AppApprovalStatus.Approved);
    expect((await store.get("c3"))?.status).toBe(AppApprovalStatus.Pending);
  });

  it("binds and unbinds devices per principal", async () => {
    await store.bindDevice(USER, "phone");
    expect(await store.isBound(USER, "phone")).toBe(true);
    expect(await store.isBound(OTHER, "phone")).toBe(false);
    expect(await store.unbindDevice(USER, "phone")).toBe(true);
    expect(await store.unbindDevice(USER, "phone")).toBe(false);
    expect(await store.isBound(USER, "phone")).toBe(false);
  });
});
