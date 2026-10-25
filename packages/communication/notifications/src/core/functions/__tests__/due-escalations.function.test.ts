/**
 * Stackra file contract:
 * Purpose: unit tests of `dueEscalations`: due steps in order, steps already run skipped, nothing after an
 *          acknowledgement.
 * Boundary: test only. The steps are test data, the way a rule set carries them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; OS-199.
 */
import { describe, expect, it } from "@stackra/testing";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import { dueEscalations } from "#core/functions/due-escalations.function";

const steps = [
  { afterSeconds: 3600, targets: ["role:manager"], channels: [NotificationChannel.Sms] },
  { afterSeconds: 600, targets: ["role:lead"], channels: [NotificationChannel.Push] },
];
const sentAt = new Date("2026-10-25T10:00:00Z");

describe("dueEscalations", () => {
  it("returns due steps not yet run, in order", () => {
    const later = new Date("2026-10-25T11:30:00Z");
    expect(
      dueEscalations(steps, { sentAt, escalated: 0 }, later).map((s) => s.afterSeconds),
    ).toEqual([600, 3600]);
    expect(
      dueEscalations(steps, { sentAt, escalated: 1 }, later).map((s) => s.afterSeconds),
    ).toEqual([3600]);
    expect(
      dueEscalations(steps, { sentAt, escalated: 0 }, new Date("2026-10-25T10:05:00Z")),
    ).toEqual([]);
  });

  it("stops once acknowledged", () => {
    expect(
      dueEscalations(
        steps,
        { sentAt, acknowledgedAt: sentAt, escalated: 0 },
        new Date("2026-10-26"),
      ),
    ).toEqual([]);
  });
});
