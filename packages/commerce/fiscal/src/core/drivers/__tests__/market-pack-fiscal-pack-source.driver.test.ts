/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPackFiscalPackSourceDriver`: it answers both channels from pack values with an overlay
 *          over its parent, a dated change on its day, a `null` channel where no value is in force, `null` for an
 *          unknown market, keeps a guest-check document mode, and refuses a value of the wrong shape.
 * Boundary: test only. Pack data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364; ADR 0385.
 */
import { isRefusal } from "@stackra/errors";
import { type MarketPack, PackStatus } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { FiscalPackSource } from "#contracts/ports/fiscal-pack-source.port";
import { MarketPackFiscalPackSourceDriver } from "#core/drivers/market-pack-fiscal-pack-source.driver";
import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";

const invoice = {
  driver: "peppol",
  options: { profile: "made-up" },
  reportingWindowHours: null,
  retentionYears: 10,
};
const till = { driver: "tse", options: {}, reportingWindowHours: 48, retentionYears: 10 };

/** A live pack version with `entries`. */
function pack(market: string, entries: MarketPack["entries"], parent?: string): MarketPack {
  return {
    market,
    ...(parent === undefined ? {} : { extends: parent }),
    version: "1.0.0",
    status: PackStatus.Live,
    entries,
    reviews: [],
    checklist: [],
  };
}

const packs = [
  pack("xx", [{ key: "fiscal.invoice", value: invoice, from: "2026-01-01" }]),
  pack(
    "xx-one",
    [
      { key: "fiscal.till", value: till, from: "2026-07-01" },
      { key: "fiscal.invoice", value: null, from: "2027-01-01" },
    ],
    "xx",
  ),
  pack("xy", [{ key: "fiscal.till", value: { driver: "" }, from: "2026-01-01" }]),
];

describe("MarketPackFiscalPackSourceDriver", () => {
  const source = MarketPackFiscalPackSourceDriver.with(packs);

  it("is a FiscalPackSource that reads both channels through overlays and dates", async () => {
    expect(source).toBeInstanceOf(FiscalPackSource);
    expect(await source.section("xx-one", new Date("2026-03-01T12:00:00Z"))).toEqual({
      invoice,
      till: null,
    });
    expect(await source.section("xx-one", new Date("2026-07-01T00:00:00Z"))).toEqual({
      invoice,
      till,
    });
    expect(await source.section("xx-one", new Date("2027-02-01T00:00:00Z"))).toEqual({
      invoice: null,
      till,
    });
  });

  it("keeps a guest-check document mode and refuses an unknown one", async () => {
    const checked = { ...till, checkDocument: "per_part" };
    const modes = MarketPackFiscalPackSourceDriver.with([
      pack("xc", [{ key: "fiscal.till", value: checked, from: "2026-01-01" }]),
      pack("xd", [
        { key: "fiscal.till", value: { ...till, checkDocument: "per_seat" }, from: "2026-01-01" },
      ]),
    ]);
    expect((await modes.section("xc", new Date("2026-03-01T00:00:00Z")))?.till).toEqual(checked);
    await expect(modes.section("xd", new Date("2026-03-01T00:00:00Z"))).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, FiscalOptionsInvalidError),
    );
  });

  it("answers null for an unknown market", async () => {
    expect(await source.section("zz", new Date("2026-03-01T00:00:00Z"))).toBeNull();
  });

  it("refuses a value of the wrong shape", async () => {
    const error: unknown = await source
      .section("xy", new Date("2026-03-01T00:00:00Z"))
      .catch((caughtError: unknown) => caughtError);
    expect(isRefusal(error, FiscalOptionsInvalidError) && error.driver).toBe("fiscal.till");
  });
});
