/**
 * Stackra file contract:
 * Purpose: unit tests of the app approval events: each builds from its payload with the registered schema, is frozen,
 *          and refuses a payload that breaks the schema (a non-`usr` principal, an unknown purpose or reason).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1304; ADR 0141.
 */
import { describe, expect, it } from "@stackra/testing";

import { AppApprovalApproved } from "#core/events/app-approval-approved.event";
import { AppApprovalDenied } from "#core/events/app-approval-denied.event";
import { AppApprovalRequested } from "#core/events/app-approval-requested.event";

const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const AT = "2026-10-27T09:00:00.000Z";

describe("app approval events", () => {
  it("build from their payloads, frozen", () => {
    const requested = AppApprovalRequested.create({
      challengeId: "c1",
      principal: USER,
      purpose: "sign_in",
      expiresAt: AT,
    });
    expect(Object.isFrozen(requested)).toBe(true);
    expect(
      AppApprovalApproved.create({
        challengeId: "c1",
        principal: USER,
        purpose: "step_up",
        device: "phone",
        at: AT,
      }).device,
    ).toBe("phone");
    expect(
      AppApprovalDenied.create({
        challengeId: "c1",
        principal: USER,
        purpose: "sign_in",
        reason: "number_mismatch",
        device: "phone",
        at: AT,
      }).reason,
    ).toBe("number_mismatch");
  });

  it("refuse a payload that breaks the schema", () => {
    expect(() =>
      AppApprovalRequested.create({
        challengeId: "c1",
        principal: "org_01j9z3k4m5n6p7q8r9s0t1v2w3" as typeof USER,
        purpose: "sign_in",
        expiresAt: AT,
      }),
    ).toThrow();
    expect(() =>
      AppApprovalDenied.create({
        challengeId: "c1",
        principal: USER,
        purpose: "sign_in",
        reason: "bored" as "denied",
        device: "phone",
        at: AT,
      }),
    ).toThrow();
  });
});
