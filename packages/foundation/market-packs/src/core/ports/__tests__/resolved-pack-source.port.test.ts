/**
 * Stackra file contract:
 * Purpose: unit tests of the `ResolvedPackSource` port: it is a `Port`; `valueFor` resolves the market over the
 *          driver's packs (overlay over parent, pins and statuses honoured), reads on the day asked or today, answers
 *          `undefined` for a key not in force, and passes on `PackNotFoundError`; `sectionFor` reads a typed section
 *          (overlay over parent, a default for a key not in force) and throws on a value that fails the schema.
 * Boundary: test only; a subclass serving fixture packs stands in for a driver. Pack data is made up (`xa`, `xa-one`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0418.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { PackStatus } from "#core/enums/pack-status.enum";
import { PackNotFoundError } from "#core/errors/pack-not-found.error";
import { ResolvedPackSource } from "#core/ports/resolved-pack-source.port";
import type { MarketPack } from "#core/types/market-pack.type";

const BASE: MarketPack = {
  market: "xa",
  version: "1.0.0",
  status: PackStatus.Live,
  entries: [
    { key: "billing.currency", value: "XAA", from: "2000-01-01" },
    { key: "billing.days", value: 7, from: "2000-01-01", until: "2000-12-31" },
    { key: "billing.dunning.grace_days", value: 5, from: "2000-01-01" },
    { key: "billing.dunning.retry_days", value: [1, 3, 7], from: "2000-01-01" },
    { key: "billing.dunning.tax_inclusive", value: true, from: "2999-01-01" },
    { key: "billing.broken.grace_days", value: "five", from: "2000-01-01" },
  ],
  reviews: [],
  checklist: [],
};

const OVERLAY: MarketPack = {
  market: "xa-one",
  extends: "xa",
  version: "1.0.0",
  status: PackStatus.Draft,
  entries: [
    { key: "billing.currency", value: "XAB", from: "2026-01-01" },
    { key: "billing.dunning.grace_days", value: 10, from: "2026-01-01" },
  ],
  reviews: [],
  checklist: [],
};

/** A typed section: `billing.dunning.*`. */
class DunningDefaults extends Schema {
  static readonly packPrefix = "billing.dunning";

  graceDays = 3;

  retryDays: number[] = [];

  taxInclusive = false;
}

/** The same fields over a section whose value fails the schema. */
class BrokenDefaults extends DunningDefaults {
  static override readonly packPrefix = "billing.broken";
}

const DUNNING_SCHEMA = z.object({
  graceDays: z.number().int().default(3),
  retryDays: z.array(z.number().int()).default([]),
  taxInclusive: z.boolean().default(false),
});
registerSchemas([
  [DunningDefaults, DUNNING_SCHEMA],
  [BrokenDefaults, DUNNING_SCHEMA],
]);

/** Serves the two fixture packs. */
class FixtureSource extends ResolvedPackSource {
  async packs(): Promise<readonly MarketPack[]> {
    return [BASE, OVERLAY];
  }
}

describe("ResolvedPackSource", () => {
  const source = new FixtureSource();

  it("is a port", () => {
    expect(source).toBeInstanceOf(Port);
  });

  it("reads a value on the day asked, overlay over parent", async () => {
    const statuses = [PackStatus.Live, PackStatus.Draft];
    expect(
      (await source.valueFor("xa-one", "billing.currency", { on: "2026-06-01", statuses }))?.value,
    ).toBe("XAB");
    expect(
      (await source.valueFor("xa-one", "billing.currency", { on: "2025-06-01", statuses }))?.market,
    ).toBe("xa");
  });

  it("reads today when no day is given and answers undefined for a key out of force", async () => {
    expect((await source.valueFor("xa", "billing.currency"))?.value).toBe("XAA");
    expect(await source.valueFor("xa", "billing.days")).toBeUndefined();
  });

  it("reads a typed section in one resolve: overlay over parent, defaults for keys not in force (STA-1726)", async () => {
    const base = await source.sectionFor("xa", DunningDefaults);
    expect(base).toBeInstanceOf(DunningDefaults);
    expect({ ...base }).toEqual({ graceDays: 5, retryDays: [1, 3, 7], taxInclusive: false });
    const statuses = [PackStatus.Live, PackStatus.Draft];
    const overlay = await source.sectionFor("xa-one", DunningDefaults, {
      on: "2026-06-01",
      statuses,
    });
    expect({ ...overlay }).toEqual({ graceDays: 10, retryDays: [1, 3, 7], taxInclusive: false });
  });

  it("throws when a section value fails the schema", async () => {
    await expect(source.sectionFor("xa", BrokenDefaults)).rejects.toThrow();
  });

  it("passes on a market with no accepted pack", async () => {
    await expect(source.valueFor("xa-one", "billing.currency")).rejects.toBeInstanceOf(
      PackNotFoundError,
    );
  });
});
