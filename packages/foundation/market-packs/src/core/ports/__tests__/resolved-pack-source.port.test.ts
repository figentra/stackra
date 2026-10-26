/**
 * Stackra file contract:
 * Purpose: unit tests of the `ResolvedPackSource` port: it is a `Port`; `valueFor` resolves the market over the
 *          driver's packs (overlay over parent, pins and statuses honoured), reads on the day asked or today, answers
 *          `undefined` for a key not in force, and passes on `PackNotFoundError`.
 * Boundary: test only; a subclass serving fixture packs stands in for a driver. Pack data is made up (`xa`, `xa-one`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0418.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

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
  ],
  reviews: [],
  checklist: [],
};

const OVERLAY: MarketPack = {
  market: "xa-one",
  extends: "xa",
  version: "1.0.0",
  status: PackStatus.Draft,
  entries: [{ key: "billing.currency", value: "XAB", from: "2026-01-01" }],
  reviews: [],
  checklist: [],
};

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

  it("passes on a market with no accepted pack", async () => {
    await expect(source.valueFor("xa-one", "billing.currency")).rejects.toBeInstanceOf(
      PackNotFoundError,
    );
  });
});
