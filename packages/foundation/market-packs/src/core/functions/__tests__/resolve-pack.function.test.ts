/**
 * Stackra file contract:
 * Purpose: unit tests of `resolvePack`: overlays of any depth root first with sections beside each base (a section per
 *          overlay), pins per market, accepted statuses, a missing market, overlay loops of any length, and product
 *          sections with no base pack (`requireBase: false`).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370; ADR 0455.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PackRejection } from "#core/enums/pack-rejection.enum";
import { PackStatus } from "#core/enums/pack-status.enum";
import { PackNotFoundError } from "#core/errors/pack-not-found.error";
import { PackRejectedError } from "#core/errors/pack-rejected.error";
import { resolvePack } from "#core/functions/resolve-pack.function";
import type { MarketPack } from "#core/types/market-pack.type";
import type { ResolveOptions } from "#core/types/resolve-options.type";

/** A pack version with empty lists, changed by `change`. */
function pack(change: Partial<MarketPack> & Pick<MarketPack, "market" | "version">): MarketPack {
  return { status: PackStatus.Live, entries: [], reviews: [], checklist: [], ...change };
}

const packs = [
  pack({ market: "xa", version: "1.0.0" }),
  pack({ market: "xa", version: "2.0.0" }),
  pack({ market: "xa", section: "shop", version: "2.3.0" }),
  pack({ market: "xa-one", extends: "xa", version: "1.0.0" }),
  pack({ market: "xa-one", extends: "xa", version: "1.1.0", status: PackStatus.Beta }),
];

/** The labels of the layers. */
function labels(market: string, options: ResolveOptions = {}): string[] {
  return resolvePack(packs, market, options).layers.map(
    (layer) => `${layer.market}${layer.section ? `/${layer.section}` : ""}@${layer.version}`,
  );
}

describe("resolvePack", () => {
  it("lists the root first and the overlay last", () => {
    expect(labels("xa-one")).toEqual(["xa@2.0.0", "xa-one@1.0.0"]);
    expect(resolvePack(packs, "xa-one").market).toBe("xa-one");
  });

  it("resolves a chain of any depth, parent first, with a section per overlay", () => {
    const deep = [
      ...packs,
      pack({ market: "xa-one-city", extends: "xa-one", version: "1.0.0" }),
      pack({ market: "xa-one-city", section: "shop", version: "1.0.0" }),
      pack({ market: "xa-one-city-ward", extends: "xa-one-city", version: "1.0.0" }),
    ];
    expect(
      resolvePack(deep, "xa-one-city-ward", { sections: ["shop"] }).layers.map(
        (layer) => `${layer.market}${layer.section ? `/${layer.section}` : ""}`,
      ),
    ).toEqual(["xa", "xa/shop", "xa-one", "xa-one-city", "xa-one-city/shop", "xa-one-city-ward"]);
  });

  it("applies a pin per market and the accepted statuses", () => {
    expect(labels("xa-one", { pins: { xa: "1" } })).toEqual(["xa@1.0.0", "xa-one@1.0.0"]);
    expect(labels("xa-one", { statuses: [PackStatus.Beta, PackStatus.Live] })).toEqual([
      "xa@2.0.0",
      "xa-one@1.1.0",
    ]);
  });

  it("adds a requested section on its base pack's major line", () => {
    expect(labels("xa-one", { sections: ["shop", "clinic"] })).toEqual([
      "xa@2.0.0",
      "xa/shop@2.3.0",
      "xa-one@1.0.0",
    ]);
    expect(labels("xa", { pins: { xa: "1" }, sections: ["shop"] })).toEqual(["xa@1.0.0"]);
  });

  it("refuses a market with no fitting version", () => {
    const error: unknown = (() => {
      try {
        return resolvePack(packs, "xa-one", { pins: { xa: "9" } });
      } catch (caughtError) {
        return caughtError;
      }
    })();
    expect(isRefusal(error, PackNotFoundError) && [error.market, error.pin]).toEqual(["xa", "9"]);
    expect(() => resolvePack(packs, "xb")).toThrow(PackNotFoundError);
  });

  it("refuses an overlay loop", () => {
    const loop = [
      pack({ market: "xa", extends: "xb", version: "1.0.0" }),
      pack({ market: "xb", extends: "xa", version: "1.0.0" }),
    ];
    const error: unknown = (() => {
      try {
        return resolvePack(loop, "xa");
      } catch (caughtError) {
        return caughtError;
      }
    })();
    expect(isRefusal(error, PackRejectedError) && error.reason).toBe(PackRejection.OverlayCycle);
    const longer = [
      pack({ market: "xa", extends: "xc", version: "1.0.0" }),
      pack({ market: "xb", extends: "xa", version: "1.0.0" }),
      pack({ market: "xc", extends: "xb", version: "1.0.0" }),
    ];
    expect(() => resolvePack(longer, "xb")).toThrow(PackRejectedError);
  });

  it("resolves product sections with no base pack when the base is not required", () => {
    const sectionsOnly = [
      pack({ market: "xa", section: "shop", version: "1.0.0" }),
      pack({ market: "xa", section: "shop", version: "2.0.0" }),
      pack({ market: "xa-one-city", section: "shop", version: "1.0.0" }),
    ];
    expect(
      resolvePack(sectionsOnly, "xa-one-city", {
        sections: ["shop"],
        requireBase: false,
      }).layers.map((layer) => `${layer.market}/${layer.section}@${layer.version}`),
    ).toEqual(["xa/shop@2.0.0", "xa-one-city/shop@1.0.0"]);
    expect(
      resolvePack(sectionsOnly, "xa", {
        sections: ["shop"],
        requireBase: false,
        pins: { xa: "1" },
      }).layers.map((layer) => layer.version),
    ).toEqual(["1.0.0"]);
    expect(() => resolvePack(sectionsOnly, "xa-one-city", { sections: ["shop"] })).toThrow(
      PackNotFoundError,
    );
    expect(() =>
      resolvePack(sectionsOnly, "xb", { sections: ["shop"], requireBase: false }),
    ).toThrow(PackNotFoundError);
  });

  it("follows a base pack's extends when one exists and the base is not required", () => {
    expect(labels("xa-one", { sections: ["shop"], requireBase: false })).toEqual([
      "xa@2.0.0",
      "xa/shop@2.3.0",
      "xa-one@1.0.0",
    ]);
  });
});
