/**
 * Stackra file contract:
 * Purpose: unit tests of `queueAckDeadline`: the largest visibility timeout any environment gives the queue, at least
 *          one second, and undefined when no environment sets one (STA-2050).
 * Boundary: test only; runs on the billing IR fixture with hand-made runway queue settings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (runway v3); STA-2050.
 */
import { describe, expect, it } from "@stackra/testing";

import { queueAckDeadline } from "#core/functions/queue-ack-deadline.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";

describe(queueAckDeadline, () => {
  const ir = {
    ...BILLING_IR,
    queueSettings: {
      dev: { billing: { visibilityTimeoutSeconds: 30 }, ledger: { visibilityTimeoutSeconds: 0 } },
      production: { billing: { visibilityTimeoutSeconds: 300, dlq: true }, default: { dlq: true } },
      staging: { billing: { visibilityTimeoutSeconds: 120 } },
    },
  };

  it("takes the largest visibility timeout any environment gives the queue", () => {
    expect(queueAckDeadline(ir, "billing")).toBe(300);
  });

  it("gives at least the one second Encore accepts", () => {
    expect(queueAckDeadline(ir, "ledger")).toBe(1);
  });

  it("is undefined when no environment sets the queue's timeout", () => {
    expect(queueAckDeadline(ir, "default")).toBeUndefined();
    expect(queueAckDeadline(ir, "unknown")).toBeUndefined();
    expect(queueAckDeadline(BILLING_IR, "billing")).toBeUndefined();
  });
});
