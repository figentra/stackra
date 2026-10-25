/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryReviewItemSinkDriver`: it is a `ReviewItemSink` and keeps each recorded item, frozen,
 *          in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0337 (decisions 4 and 5).
 */
import { ActorKind, ApiArea } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ReviewItemSink, ReviewReason } from "#contracts/index";
import type { ReviewItem } from "#contracts/index";
import { MemoryReviewItemSinkDriver } from "#core/drivers/memory-review-item-sink.driver";

const item = (reason: ReviewReason): ReviewItem => ({
  call: {
    callId: "c1",
    type: MemoryReviewItemSinkDriver,
    kind: "action",
    key: "sales.sale.complete@1",
    actor: { kind: ActorKind.Agent, id: "agt_1" },
    area: ApiArea.App,
  },
  at: new Date("2026-10-25T09:00:00Z"),
  reason,
  ruleVersion: "2.3.0",
  acceptedVersion: "2.4.0",
  client: { total: 900 },
  server: { total: 950 },
  output: { saleId: "sal_1" },
});

describe("MemoryReviewItemSinkDriver", () => {
  it("is a ReviewItemSink", () => {
    expect(new MemoryReviewItemSinkDriver()).toBeInstanceOf(ReviewItemSink);
  });

  it("keeps each item in order, frozen", async () => {
    const sink = new MemoryReviewItemSinkDriver();
    await sink.record(item(ReviewReason.Differs));
    await sink.record(item(ReviewReason.OlderRuleVersion));
    expect(sink.items.map((recorded) => recorded.reason)).toEqual([
      "differs",
      "older_rule_version",
    ]);
    expect(Object.isFrozen(sink.items[0])).toBe(true);
  });
});
