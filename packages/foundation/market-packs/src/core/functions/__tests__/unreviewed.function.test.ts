/**
 * Stackra file contract:
 * Purpose: unit tests of `unreviewed`: each key without a sign-off, once, in entry order.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { PackStatus } from "#core/enums/pack-status.enum";
import { unreviewed } from "#core/functions/unreviewed.function";
import type { MarketPack } from "#core/types/market-pack.type";

/** A pack version with empty lists, changed by `change`. */
function pack(change: Partial<MarketPack> & Pick<MarketPack, "market" | "version">): MarketPack {
  return { status: PackStatus.Live, entries: [], reviews: [], checklist: [], ...change };
}

describe("unreviewed", () => {
  it("lists each key with no sign-off once", () => {
    const draft = pack({
      market: "xa",
      version: "1.0.0",
      status: PackStatus.Draft,
      entries: [
        { key: "b", value: 1, from: "2026-01-01" },
        { key: "a", value: 1, from: "2026-01-01" },
        { key: "b", value: 2, from: "2026-07-01" },
        { key: "c", value: 1, from: "2026-01-01" },
      ],
      reviews: [{ key: "a", reviewer: "reviewer_1", at: "2026-01-02" }],
    });
    expect(unreviewed(draft)).toEqual(["b", "c"]);
  });

  it("is empty when every key is signed off", () => {
    const signed = pack({
      market: "xa",
      version: "1.0.0",
      entries: [{ key: "a", value: 1, from: "2026-01-01" }],
      reviews: [{ key: "a", reviewer: "reviewer_1", at: "2026-01-02" }],
    });
    expect(unreviewed(signed)).toEqual([]);
  });
});
