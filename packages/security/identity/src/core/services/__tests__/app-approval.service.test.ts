/**
 * Stackra file contract:
 * Purpose: unit tests of `AppApprovalService` over `MemoryAppApprovalChallengesDriver`: number matching approves and a
 *          wrong number denies; a grant completes once with the configured assurance and step-up window; an unknown
 *          account gets a ticket that looks real, records nothing and lapses; only a bound device answers; one pending
 *          challenge per principal per device; the rate limits; the QR variant; step-up; and the events.
 * Boundary: test only; a movable clock and the memory identity resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1304 (owner request 2026-10-27).
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { takeRecordedEvents } from "@stackra/events";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { AppApprovalPurpose, AppApprovalStatus } from "#contracts/index";
import type { AppApprovalChallenge, AppApprovalRequester } from "#contracts/index";
import { MemoryAppApprovalChallengesDriver } from "#core/drivers/memory-app-approval-challenges.driver";
import { MemoryIdentityResolverDriver } from "#core/drivers/memory-identity-resolver.driver";
import { AppApprovalRateLimitedError } from "#core/errors/app-approval-rate-limited.error";
import { AppApprovalRejectedError } from "#core/errors/app-approval-rejected.error";
import { AppApprovalApproved } from "#core/events/app-approval-approved.event";
import { AppApprovalDenied } from "#core/events/app-approval-denied.event";
import { AppApprovalRequested } from "#core/events/app-approval-requested.event";
import { AppApprovalService } from "#core/services/app-approval.service";
import type { AppApprover } from "#core/types/app-approver.type";

/** A clock the test moves. */
class MovableClockDriver extends Driver(Clock) {
  at = new Date("2026-10-27T09:00:00Z");

  now(): Date {
    return new Date(this.at);
  }
}

const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const OTHER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4";
const LAPTOP: AppApprovalRequester = {
  device: "laptop",
  ip: "203.0.113.7",
  location: "Riyadh, SA",
  userAgent: "Firefox/131",
};
const PHONE: AppApprover = { principal: USER, device: "phone" };

describe("AppApprovalService", () => {
  let clock: MovableClockDriver;
  let store: MemoryAppApprovalChallengesDriver;
  let approvals: AppApprovalService;

  /** A service with `values` over the shared store and clock. */
  function serviceWith(values: Record<string, unknown> = {}): AppApprovalService {
    return new AppApprovalService(
      buildConfig(IdentityConfig, { values: { appApprovalMaxRequests: 3, ...values } }),
      store,
      new MemoryIdentityResolverDriver({ [USER]: { email: "rana@acme.example", locale: "ar" } }),
      clock,
    );
  }

  /** The stored challenge `id`; fails the test when there is none. */
  async function stored(id: string): Promise<AppApprovalChallenge> {
    const challenge = await store.get(id);
    if (challenge === undefined) throw new Error(`no challenge ${id}`);
    return challenge;
  }

  /** An unknown account's sign-in from `device`. */
  const ask = (device: string) =>
    approvals.request({
      purpose: AppApprovalPurpose.SignIn,
      requester: { ...LAPTOP, device },
      loginHint: "nobody@acme.example",
    });

  /** A sign-in for Rana from the laptop. */
  const signIn = () =>
    approvals.request({
      purpose: AppApprovalPurpose.SignIn,
      requester: LAPTOP,
      loginHint: " Rana@Acme.example ",
    });

  beforeEach(async () => {
    clock = new MovableClockDriver();
    store = new MemoryAppApprovalChallengesDriver();
    await store.bindDevice(USER, PHONE.device);
    approvals = serviceWith();
  });

  it("asks the app, which sees the requester and picks the shown number to approve", async () => {
    const ticket = await signIn();
    expect(ticket.number).toBeGreaterThanOrEqual(10);
    expect(ticket.expiresAt).toEqual(new Date("2026-10-27T09:01:00Z"));
    const challenge = await stored(ticket.id);
    expect(takeRecordedEvents(challenge)).toEqual([expect.any(AppApprovalRequested)]);
    expect(challenge.pollHash).not.toBe(ticket.pollSecret);

    const [prompt] = await approvals.pending(PHONE);
    expect(prompt).toMatchObject({ id: ticket.id, requester: LAPTOP, purpose: "sign_in" });
    expect(prompt?.choices).toHaveLength(4);
    expect(prompt?.choices).toContain(ticket.number);

    expect(await approvals.status(ticket.id, ticket.pollSecret)).toBe("pending");
    clock.at = new Date("2026-10-27T09:00:20Z");
    expect(await approvals.approve(ticket.id, PHONE, ticket.number)).toBe(true);
    expect(takeRecordedEvents(await stored(ticket.id))).toEqual([expect.any(AppApprovalApproved)]);
    expect(await approvals.status(ticket.id, ticket.pollSecret)).toBe("approved");

    const grant = await approvals.complete(ticket.id, ticket.pollSecret);
    expect(grant).toEqual({
      principal: USER,
      purpose: "sign_in",
      assurance: { level: "aal2", authenticatedAt: new Date("2026-10-27T09:00:20Z") },
      freshUntil: new Date("2026-10-27T09:10:20Z"),
    });
    await expect(approvals.complete(ticket.id, ticket.pollSecret)).rejects.toBeInstanceOf(
      AppApprovalRejectedError,
    );
    expect(await approvals.status(ticket.id, ticket.pollSecret)).toBe("ended");
  });

  it("denies on a wrong number", async () => {
    const ticket = await signIn();
    const wrong = (await stored(ticket.id)).choices.find((choice) => choice !== ticket.number);
    expect(await approvals.approve(ticket.id, PHONE, wrong)).toBe(false);
    const denied = await stored(ticket.id);
    expect(denied.status).toBe(AppApprovalStatus.Denied);
    const [event] = takeRecordedEvents(denied);
    expect(event).toBeInstanceOf(AppApprovalDenied);
    expect((event as AppApprovalDenied).reason).toBe("number_mismatch");
    expect(await approvals.status(ticket.id, ticket.pollSecret)).toBe("ended");
    await expect(approvals.approve(ticket.id, PHONE, ticket.number)).rejects.toBeInstanceOf(
      AppApprovalRejectedError,
    );
  });

  it("denies when the user says no", async () => {
    const ticket = await signIn();
    await approvals.deny(ticket.id, PHONE);
    const [event] = takeRecordedEvents(await stored(ticket.id));
    expect((event as AppApprovalDenied).reason).toBe("denied");
    expect(await approvals.status(ticket.id, ticket.pollSecret)).toBe("ended");
  });

  it("gives an unknown account a ticket that looks real, records nothing and lapses", async () => {
    const ticket = await approvals.request({
      purpose: AppApprovalPurpose.SignIn,
      requester: LAPTOP,
      loginHint: "nobody@acme.example",
    });
    expect(Object.keys(ticket).sort()).toEqual([
      "expiresAt",
      "id",
      "number",
      "pollSecret",
      "qrToken",
    ]);
    expect(takeRecordedEvents(await stored(ticket.id))).toEqual([]);
    expect(await approvals.status(ticket.id, ticket.pollSecret)).toBe("pending");
    expect(await approvals.pending(PHONE)).toEqual([]);
    clock.at = new Date("2026-10-27T09:01:00Z");
    expect(await approvals.status(ticket.id, ticket.pollSecret)).toBe("ended");
    expect(await approvals.sweep()).toBe(1);
  });

  it("tells a wrong poll secret or an unknown id only that it ended", async () => {
    const ticket = await signIn();
    expect(await approvals.status(ticket.id, "guess")).toBe("ended");
    expect(await approvals.status("nope", ticket.pollSecret)).toBe("ended");
    await approvals.approve(ticket.id, PHONE, ticket.number);
    await expect(approvals.complete(ticket.id, "guess")).rejects.toBeInstanceOf(
      AppApprovalRejectedError,
    );
  });

  it("lets only a bound device of the principal answer", async () => {
    const ticket = await signIn();
    const stranger: AppApprover = { principal: USER, device: "tablet" };
    expect(await approvals.pending(stranger)).toEqual([]);
    await expect(approvals.approve(ticket.id, stranger, ticket.number)).rejects.toBeInstanceOf(
      AppApprovalRejectedError,
    );
    await store.bindDevice(OTHER, "other-phone");
    await expect(
      approvals.approve(ticket.id, { principal: OTHER, device: "other-phone" }, ticket.number),
    ).rejects.toBeInstanceOf(AppApprovalRejectedError);
    expect(
      await serviceWith({ appApprovalEnrolledDevicesOnly: false }).pending(stranger),
    ).toHaveLength(1);
  });

  it("refuses an answer after the challenge lapsed", async () => {
    const ticket = await signIn();
    clock.at = new Date("2026-10-27T09:01:00Z");
    await expect(approvals.approve(ticket.id, PHONE, ticket.number)).rejects.toBeInstanceOf(
      AppApprovalRejectedError,
    );
  });

  it("refuses to complete a challenge nobody approved", async () => {
    const ticket = await signIn();
    await expect(approvals.complete(ticket.id, ticket.pollSecret)).rejects.toBeInstanceOf(
      AppApprovalRejectedError,
    );
  });

  it("keeps one pending challenge per principal per requesting device", async () => {
    const first = await signIn();
    const fromPhoneBrowser = await approvals.request({
      purpose: AppApprovalPurpose.SignIn,
      requester: { ...LAPTOP, device: "desktop" },
      principal: USER,
    });
    const second = await signIn();
    expect((await stored(first.id)).status).toBe(AppApprovalStatus.Expired);
    expect((await approvals.pending(PHONE)).map((prompt) => prompt.id).sort()).toEqual(
      [fromPhoneBrowser.id, second.id].sort(),
    );
  });

  it("rate-limits a device and a target alike, whether the account exists or not", async () => {
    for (let run = 0; run < 3; run += 1) await signIn();
    await expect(signIn()).rejects.toBeInstanceOf(AppApprovalRateLimitedError);
    for (const device of ["a", "b", "c"]) await ask(device);
    await expect(ask("d")).rejects.toBeInstanceOf(AppApprovalRateLimitedError);
    clock.at = new Date("2026-10-27T09:15:01Z");
    await expect(signIn()).resolves.toBeDefined();
  });

  it("signs in by QR: the scanning app's principal approves with no number, once", async () => {
    const ticket = await approvals.request({
      purpose: AppApprovalPurpose.SignIn,
      requester: LAPTOP,
    });
    const prompt = await approvals.redeem(ticket.qrToken, PHONE);
    expect(prompt.choices).toEqual([]);
    await expect(approvals.redeem(ticket.qrToken, PHONE)).rejects.toBeInstanceOf(
      AppApprovalRejectedError,
    );
    expect(await approvals.approve(prompt.id, PHONE)).toBe(true);
    expect((await approvals.complete(ticket.id, ticket.pollSecret)).principal).toBe(USER);
  });

  it("refuses a QR scan by another principal, or from an unbound device", async () => {
    const ticket = await signIn();
    await store.bindDevice(OTHER, "other-phone");
    await expect(
      approvals.redeem(ticket.qrToken, { principal: OTHER, device: "other-phone" }),
    ).rejects.toBeInstanceOf(AppApprovalRejectedError);
    await expect(
      approvals.redeem(ticket.qrToken, { principal: USER, device: "tablet" }),
    ).rejects.toBeInstanceOf(AppApprovalRejectedError);
    await expect(approvals.redeem("unknown", PHONE)).rejects.toBeInstanceOf(
      AppApprovalRejectedError,
    );
  });

  it("steps a session up: the grant names the session and the window", async () => {
    await expect(
      approvals.request({ purpose: AppApprovalPurpose.StepUp, requester: LAPTOP, principal: USER }),
    ).rejects.toBeInstanceOf(TypeError);
    const ticket = await approvals.request({
      purpose: AppApprovalPurpose.StepUp,
      requester: LAPTOP,
      principal: USER,
      sessionId: "ses_1",
    });
    await approvals.approve(ticket.id, PHONE, ticket.number);
    const grant = await approvals.complete(ticket.id, ticket.pollSecret);
    expect(grant).toMatchObject({ purpose: "step_up", sessionId: "ses_1", principal: USER });
    expect(grant.freshUntil).toEqual(new Date("2026-10-27T09:10:00Z"));
  });
});
