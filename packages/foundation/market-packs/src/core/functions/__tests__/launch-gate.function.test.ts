/**
 * Stackra file contract:
 * Purpose: unit tests of `launchGate`: layers not live, checklist items for the product or every product, unreviewed keys, and a ready gate.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { PackStatus } from "#core/enums/pack-status.enum";
import { launchGate } from "#core/functions/launch-gate.function";
import type { MarketPack } from "#core/types/market-pack.type";

/** A pack version with empty lists, changed by `change`. */
function pack(change: Partial<MarketPack> & Pick<MarketPack, "market" | "version">): MarketPack {
  return { status: PackStatus.Live, entries: [], reviews: [], checklist: [], ...change };
}

describe("launchGate", () => {
  it("lists what stands before launch", () => {
    const gate = launchGate(
      {
        market: "xa-one",
        layers: [
          pack({
            market: "xa",
            version: "1.0.0",
            entries: [{ key: "a", value: 1, from: "2026-01-01" }],
            checklist: [
              { id: "counsel", doneBy: "reviewer_1", doneAt: "2026-01-02" },
              { id: "registration" },
              { id: "other_product_item", product: "academy" },
            ],
          }),
          pack({
            market: "xa-one",
            extends: "xa",
            version: "1.0.0",
            status: PackStatus.Beta,
            checklist: [{ id: "driver", product: "shop" }],
          }),
        ],
      },
      "shop",
    );
    expect(gate).toEqual({
      ready: false,
      notLive: ["xa-one@1.0.0"],
      pending: ["xa@1.0.0:registration", "xa-one@1.0.0:driver"],
      unreviewed: ["xa@1.0.0:a"],
    });
  });

  it("is ready when every layer is live, done and reviewed", () => {
    const ready = launchGate(
      {
        market: "xa",
        layers: [
          pack({
            market: "xa",
            version: "1.0.0",
            entries: [{ key: "a", value: 1, from: "2026-01-01" }],
            reviews: [{ key: "a", reviewer: "reviewer_1", at: "2026-01-02" }],
            checklist: [{ id: "counsel", doneAt: "2026-01-02" }],
          }),
        ],
      },
      "shop",
    );
    expect(ready).toEqual({ ready: true, notLive: [], pending: [], unreviewed: [] });
  });
});
