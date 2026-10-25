/**
 * Stackra file contract:
 * Purpose: unit tests of `pickPack`: the highest accepted version, a major-line pin, an exact pin, sections kept apart and nothing when nothing fits.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { PackStatus } from "#core/enums/pack-status.enum";
import { pickPack } from "#core/functions/pick-pack.function";
import type { MarketPack } from "#core/types/market-pack.type";

/** A pack version with empty lists, changed by `change`. */
function pack(change: Partial<MarketPack> & Pick<MarketPack, "market" | "version">): MarketPack {
  return { status: PackStatus.Live, entries: [], reviews: [], checklist: [], ...change };
}

const packs = [
  pack({ market: "xa", version: "1.4.0" }),
  pack({ market: "xa", version: "2.0.0" }),
  pack({ market: "xa", version: "2.1.0" }),
  pack({ market: "xa", version: "2.2.0", status: PackStatus.Beta }),
  pack({ market: "xa", version: "3.0.0", status: PackStatus.Draft }),
  pack({ market: "xa", section: "shop", version: "2.5.0" }),
];
const live = [PackStatus.Live];

describe("pickPack", () => {
  it("picks the highest accepted version", () => {
    expect(pickPack(packs, "xa", undefined, undefined, live)?.version).toBe("2.1.0");
    expect(
      pickPack(packs, "xa", undefined, undefined, [PackStatus.Beta, PackStatus.Live])?.version,
    ).toBe("2.2.0");
  });

  it("keeps to a major line or one exact version", () => {
    expect(pickPack(packs, "xa", undefined, "1", live)?.version).toBe("1.4.0");
    expect(pickPack(packs, "xa", undefined, "2.0.0", live)?.version).toBe("2.0.0");
  });

  it("keeps sections apart from base packs", () => {
    expect(pickPack(packs, "xa", "shop", "2", live)?.version).toBe("2.5.0");
    expect(pickPack(packs, "xa", "shop", "1", live)).toBeUndefined();
  });

  it("returns undefined when nothing fits", () => {
    expect(pickPack(packs, "xa", undefined, "3", live)).toBeUndefined();
    expect(pickPack(packs, "xb", undefined, undefined, live)).toBeUndefined();
  });
});
