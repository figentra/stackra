/**
 * Stackra file contract:
 * Purpose: unit tests of `WORKER_MESSAGE`: the three message codes, snake_case and frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0231 (snake_case codes).
 */
import { describe, expect, it } from "@stackra/testing";

import { WORKER_MESSAGE } from "#sw/constants/worker-message.constant";

describe("WORKER_MESSAGE", () => {
  it("holds the three message codes", () => {
    expect(WORKER_MESSAGE).toEqual({
      OutboxDrain: "outbox_drain",
      PushSubscriptionChanged: "push_subscription_changed",
      SkipWaiting: "skip_waiting",
    });
    expect(Object.isFrozen(WORKER_MESSAGE)).toBe(true);
  });
});
