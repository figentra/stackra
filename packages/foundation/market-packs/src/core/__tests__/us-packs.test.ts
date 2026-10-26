/**
 * Stackra file contract:
 * Purpose: data tests of the draft US seed packs in `assets/data/packs/`: the `us` base and its seven state overlays
 *          (NY, NJ, CA, TX, IL, MI, FL) pass `MarketPack$`, are `draft`, resolve only when drafts are accepted, put
 *          the base before each overlay, give a sale's sales tax to the buyer's state and its calendar to the
 *          location's, and are not ready to launch until counsel signs them off.
 * Boundary: test only; reads the shipped JSON from disk. It checks shape and resolution, never whether a value is
 *           legally right: that is the reviewer sign-off the launch gate asks for.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385; ADR 0370.
 */
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "@stackra/testing";

import { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";
import { PackStatus } from "#core/enums/pack-status.enum";
import { PackNotFoundError } from "#core/errors/pack-not-found.error";
import { launchGate } from "#core/functions/launch-gate.function";
import { resolvePack } from "#core/functions/resolve-pack.function";
import { valueOf } from "#core/functions/value-of.function";
import { MarketContext } from "#core/values/market-context.value";

const folder = new URL("../../../assets/data/packs/", import.meta.url);

const packs = readdirSync(folder)
  .filter((name) => name.endsWith(".json"))
  .map((name) => MARKET_PACK_SCHEMA.parse(JSON.parse(readFileSync(new URL(name, folder), "utf8"))));

const states = ["us-ca", "us-fl", "us-il", "us-mi", "us-nj", "us-ny", "us-tx"];

const drafts = { statuses: [PackStatus.Draft] };

describe("US seed packs", () => {
  it("ship the base and seven state overlays as draft", () => {
    expect(packs.map((pack) => pack.market).sort()).toEqual(["us", ...states]);
    expect(packs.every((pack) => pack.status === PackStatus.Draft)).toBe(true);
  });

  it("resolve each state over the base only when drafts are accepted", () => {
    for (const state of states) {
      expect(resolvePack(packs, state, drafts).layers.map((layer) => layer.market)).toEqual([
        "us",
        state,
      ]);
      expect(() => resolvePack(packs, state)).toThrow(PackNotFoundError);
    }
  });

  it("keep federal holidays visible under a state's own set", () => {
    const resolved = resolvePack(packs, "us-ca", drafts);
    expect(valueOf(resolved, "calendar.holidays.federal", "2026-07-01")?.market).toBe("us");
    expect(valueOf(resolved, "calendar.holidays.state", "2026-07-01")?.market).toBe("us-ca");
    expect(valueOf(resolved, "calendar.uncertain_days", "2026-07-01")?.value).toBe("working");
  });

  it("answer sales tax from the buyer's state and the calendar from the location's", () => {
    const context = MarketContext.create(packs, drafts);
    const sale = { tenant: "us-ny", location: "us-ny", buyer: "us-ca" };
    expect(context.packFor(sale, "tax.sales.rate").market).toBe("us-ca");
    expect(context.packFor(sale, "calendar.holidays.state").market).toBe("us-ny");
  });

  it("are not ready to launch before review", () => {
    const gate = launchGate(resolvePack(packs, "us-tx", drafts), "commerce");
    expect(gate.ready).toBe(false);
    expect(gate.notLive).toEqual(["us@0.1.0", "us-tx@0.1.0"]);
    expect(gate.pending).toContain("us-tx@0.1.0:counsel_review");
  });
});
