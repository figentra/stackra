/**
 * Stackra file contract:
 * Purpose: unit tests of the `ReviewItemSink` port: it is an abstract `Port` (its own token, never built directly) and a
 *          driver records review items.
 * Boundary: test only; the driver here is a stand-in for the consuming product's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263 (ports); ADR 0337 (decisions 4 and 5).
 */
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ReviewReason } from "#contracts/enums/review-reason.enum";
import { ReviewItemSink } from "#contracts/ports/review-item-sink.port";
import type { ReviewItem } from "#contracts/types/review-item.type";

class ListSinkDriver extends Driver(ReviewItemSink) {
  readonly items: ReviewItem[] = [];

  async record(item: ReviewItem): Promise<void> {
    this.items.push(item);
  }
}

describe("ReviewItemSink", () => {
  it("is an abstract port", () => {
    expect(ReviewItemSink.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new ListSinkDriver();
    const item: ReviewItem = {
      call: {
        callId: "c1",
        type: ListSinkDriver,
        kind: "action",
        key: "sales.sale.complete@1",
        actor: { kind: ActorKind.Agent, id: "agt_1" },
        area: ApiArea.App,
      },
      at: new Date("2026-10-25T09:00:00Z"),
      reason: ReviewReason.Differs,
      ruleVersion: "2.4.0",
      acceptedVersion: "2.4.0",
      client: { total: 900 },
      server: { total: 950 },
      output: { saleId: "sal_1" },
    };
    await driver.record(item);
    expect(driver.items).toEqual([item]);
  });
});
