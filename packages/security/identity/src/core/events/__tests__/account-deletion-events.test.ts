/**
 * Stackra file contract:
 * Purpose: unit tests of the account deletion events: each builds from its payload, frozen, under its gen name, and
 *          refuses a subject that is not a `usr_` id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0141; STA-1567.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AccountDeletionCancelled } from "#core/events/account-deletion-cancelled.event";
import { AccountDeletionScheduled } from "#core/events/account-deletion-scheduled.event";
import { AccountDeletionStarted } from "#core/events/account-deletion-started.event";

const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" as PublicId<"usr">;
const AT = "2026-10-29T09:00:00.000Z";

describe("account deletion events", () => {
  it("build from their payloads, frozen", () => {
    expect(Object.isFrozen(AccountDeletionScheduled.create({ subject: USER, dueAt: AT }))).toBe(
      true,
    );
    expect(AccountDeletionCancelled.create({ subject: USER, at: AT }).at).toBe(AT);
    expect(AccountDeletionStarted.create({ subject: USER, erasureId: "era_1" }).erasureId).toBe(
      "era_1",
    );
  });

  it("refuse a subject that is not a user", () => {
    const org = "org_01j9z3k4m5n6p7q8r9s0t1v2w3" as typeof USER;
    expect(() => AccountDeletionScheduled.create({ subject: org, dueAt: AT })).toThrow();
    expect(() => AccountDeletionStarted.create({ subject: org, erasureId: "era_1" })).toThrow();
  });
});
