/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryLiveActivityPushesDriver`: it records each push and answers `gone` for a token a test
 *          marked.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1539.
 */
import { describe, expect, it } from "@stackra/testing";

import { LiveActivityPushes } from "#contracts/ports/live-activity-pushes.port";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import { MemoryLiveActivityPushesDriver } from "#core/drivers/memory-live-activity-pushes.driver";

const ORDER: ActivityProgress = {
  reference: "order_1042",
  title: "Order 1042",
  status: "On the way",
  step: 3,
  steps: 4,
};

describe("MemoryLiveActivityPushesDriver", () => {
  it("is a LiveActivityPushes driver that records each push", async () => {
    const pushes = new MemoryLiveActivityPushesDriver();
    expect(pushes).toBeInstanceOf(LiveActivityPushes);
    expect(await pushes.send("a1", "update", ORDER)).toBe("sent");
    expect(pushes.sent).toEqual([{ token: "a1", event: "update", progress: ORDER }]);
  });

  it("answers gone for a marked token and records nothing", async () => {
    const pushes = new MemoryLiveActivityPushesDriver();
    pushes.goneTokens.add("a1");
    expect(await pushes.send("a1", "end", ORDER)).toBe("gone");
    expect(pushes.sent).toEqual([]);
  });
});
