/**
 * Stackra file contract:
 * Purpose: data tests of the `fiscal.*` entries in @stackra/market-packs' bundled packs: each market's mandate
 *          resolves through `MarketPackFiscalPackSourceDriver` (the pack's status forced to `live`, since the bundled
 *          packs stay `draft` until their reviewers sign), parses with `FISCAL_MANDATE_SCHEMA`, names a driver this
 *          package ships whose own options schema accepts the entry's options, and is not in force before its `from`.
 * Boundary: test only; reads the pack files from the workspace (market-packs ships them as assets). The values are
 *           the packs' and are cited in the pull request that adds them; this test checks their shape and their
 *           dates, not the law.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2); ADR 0370; ADR 0386 (as amended 2026-11-09).
 */
import { readFileSync } from "node:fs";

import { type MarketPack, MarketPack$, PackStatus } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { FISCAL_MANDATE_SCHEMA } from "#core/constants/fiscal-mandate-schema.constant";
import { ETA_OPTIONS } from "#core/constants/eta-options.constant";
import { PEPPOL_OPTIONS } from "#core/constants/peppol-options.constant";
import { ZATCA_OPTIONS } from "#core/constants/zatca-options.constant";
import { MarketPackFiscalPackSourceDriver } from "#core/drivers/market-pack-fiscal-pack-source.driver";

/** A bundled pack, forced `live` the way a reviewed release would ship it. */
const live = (market: string): MarketPack => ({
  ...MarketPack$.parse(
    JSON.parse(
      readFileSync(
        new URL(
          `../../../../../../foundation/market-packs/assets/data/packs/${market}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  ),
  status: PackStatus.Live,
});

describe("bundled fiscal mandates", () => {
  /** ZATCA phase 2 (integration), in force from 1 January 2023 in waves. */
  it("resolves Saudi Arabia's ZATCA invoice mandate from 2023-01-01, and none before", async () => {
    const source = MarketPackFiscalPackSourceDriver.with([live("sa")]);

    const section = await source.section("sa", new Date("2026-11-09T00:00:00Z"));
    const before = await source.section("sa", new Date("2022-12-31T00:00:00Z"));

    const mandate = FISCAL_MANDATE_SCHEMA.parse(section?.invoice);
    expect(mandate).toMatchObject({ driver: "zatca", reportingWindowHours: 24, retentionYears: 6 });
    expect(ZATCA_OPTIONS.safeParse(mandate.options).success).toBe(true);
    // a POS's simplified invoice is reported through the same `zatca` mandate: no till rule is guessed
    expect(section?.till).toBeNull();
    expect(before?.invoice).toBeNull();
  });

  /** ETA's e-invoice, mandatory from 15 November 2020 for its first taxpayer group. */
  it("resolves Egypt's ETA invoice mandate from 2020-11-15, needing only the issuer's activity code", async () => {
    const source = MarketPackFiscalPackSourceDriver.with([live("eg")]);

    const section = await source.section("eg", new Date("2026-11-09T00:00:00Z"));
    const before = await source.section("eg", new Date("2020-11-14T00:00:00Z"));

    const mandate = FISCAL_MANDATE_SCHEMA.parse(section?.invoice);
    expect(mandate).toMatchObject({ driver: "eta", reportingWindowHours: 24, retentionYears: 5 });
    // the activity code is the issuer's own: the unit's options supply it, never the market's pack
    expect(ETA_OPTIONS.safeParse(mandate.options).success).toBe(false);
    expect(ETA_OPTIONS.safeParse({ ...mandate.options, activityCode: "4620" }).success).toBe(true);
    expect(before?.invoice).toBeNull();
  });

  /** PINT AE through the business's own accredited service provider, mandatory for the first group from 1 January 2027. */
  it("resolves the UAE's PINT AE invoice mandate from 2027-01-01, needing only the business's own ASP", async () => {
    const source = MarketPackFiscalPackSourceDriver.with([live("ae")]);

    const section = await source.section("ae", new Date("2027-01-01T00:00:00Z"));
    const before = await source.section("ae", new Date("2026-12-31T00:00:00Z"));

    const mandate = FISCAL_MANDATE_SCHEMA.parse(section?.invoice);
    expect(mandate).toMatchObject({
      driver: "peppol",
      reportingWindowHours: null,
      retentionYears: 5,
    });
    // the ASP is brought by each business: the unit's options supply its endpoint, never the market's pack
    expect(PEPPOL_OPTIONS.safeParse(mandate.options).success).toBe(false);
    expect(
      PEPPOL_OPTIONS.safeParse({
        ...mandate.options,
        accessPointUrl: "https://asp.example.test/send",
      }).success,
    ).toBe(true);
    expect(before?.invoice).toBeNull();
  });
});
