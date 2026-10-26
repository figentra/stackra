/**
 * Stackra file contract:
 * Purpose: unit tests of `MARKET_PACK_SCHEMA`: it accepts a base pack and a product section with defaults, and refuses bad codes, versions, statuses, keys, date ranges, repeated starts and section keys or overlays.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";

const valid = {
  market: "xa-one",
  extends: "xa",
  version: "2.1.0",
  status: "live",
  entries: [
    { key: "tax.rate", value: 7, from: "2026-01-01", until: "2026-06-30" },
    { key: "tax.rate", value: 8, from: "2026-07-01" },
    {
      key: "consumer.withdrawal_days",
      value: 10,
      from: "2026-01-01",
      floor: { bound: "min", law: "Made-up Act s. 1" },
    },
  ],
};

describe("MARKET_PACK_SCHEMA", () => {
  it("accepts a pack and defaults reviews and checklist to empty", () => {
    const parsed = MARKET_PACK_SCHEMA.parse(valid);
    expect(parsed.reviews).toEqual([]);
    expect(parsed.checklist).toEqual([]);
    expect(parsed.entries[2]?.floor).toEqual({ bound: "min", law: "Made-up Act s. 1" });
  });

  it("accepts a product section whose keys carry its prefix", () => {
    const section = {
      market: "xa",
      section: "shop",
      version: "2.0.0",
      status: "beta",
      entries: [{ key: "shop.label_rule", value: { lines: 2 }, from: "2026-01-01" }],
      reviews: [{ key: "shop.label_rule", reviewer: "reviewer_1", at: "2026-01-01" }],
    };
    expect(MARKET_PACK_SCHEMA.safeParse(section).success).toBe(true);
  });

  it.each([
    ["an upper-case market", { market: "XA" }],
    ["a two-part version", { version: "2.1" }],
    ["a leading zero", { version: "02.1.0" }],
    ["an unknown status", { status: "open" }],
    ["a bad key", { entries: [{ key: "Tax Rate", value: 1, from: "2026-01-01" }] }],
    [
      "until before from",
      { entries: [{ key: "a", value: 1, from: "2026-02-01", until: "2026-01-01" }] },
    ],
    [
      "two entries starting the same day",
      {
        entries: [
          { key: "a", value: 1, from: "2026-01-01" },
          { key: "a", value: 2, from: "2026-01-01" },
        ],
      },
    ],
    [
      "an unknown floor bound",
      {
        entries: [{ key: "a", value: 1, from: "2026-01-01", floor: { bound: "about", law: "x" } }],
      },
    ],
    ["a section that overlays a market", { section: "shop", entries: [] }],
    ["an unknown subject", { subjects: [{ key: "tax", subject: "visitor" }] }],
    [
      "a key given two subjects",
      {
        subjects: [
          { key: "tax", subject: "buyer" },
          { key: "tax", subject: "location" },
        ],
      },
    ],
  ])("refuses %s", (_name, change) => {
    expect(MARKET_PACK_SCHEMA.safeParse({ ...valid, ...change }).success).toBe(false);
  });

  it("accepts a subject per key and leaves it out when absent", () => {
    const subjects = [
      { key: "tax.sales", subject: "buyer" },
      { key: "labour", subject: "location" },
    ];
    expect(MARKET_PACK_SCHEMA.parse({ ...valid, subjects }).subjects).toEqual(subjects);
    expect("subjects" in MARKET_PACK_SCHEMA.parse(valid)).toBe(false);
  });

  it("refuses a section subject outside its prefix", () => {
    const { extends: _parent, ...base } = valid;
    const section = { ...base, section: "shop", entries: [] };
    expect(
      MARKET_PACK_SCHEMA.safeParse({ ...section, subjects: [{ key: "tax", subject: "buyer" }] })
        .success,
    ).toBe(false);
    expect(
      MARKET_PACK_SCHEMA.safeParse({
        ...section,
        subjects: [{ key: "shop.tips", subject: "location" }],
      }).success,
    ).toBe(true);
  });

  it("refuses a section key outside its prefix", () => {
    const { extends: _parent, ...base } = valid;
    expect(MARKET_PACK_SCHEMA.safeParse({ ...base, section: "shop" }).success).toBe(false);
  });
});
