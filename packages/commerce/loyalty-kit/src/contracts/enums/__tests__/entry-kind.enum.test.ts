/**
 * Stackra file contract:
 * Purpose: unit tests of `EntryKind`: the six kinds, in column order, each with the tone of its badge.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum, Tone } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { EntryKind } from "#contracts/enums/entry-kind.enum";

describe("EntryKind", () => {
  it("has the six kinds the migration's check constraint lists", () => {
    expect(Enum.values(EntryKind)).toEqual([
      "earn",
      "redeem",
      "expire",
      "adjust",
      "hold",
      "release",
    ]);
  });

  it("carries a badge tone per kind", () => {
    expect(Enum.meta(EntryKind, EntryKind.Earn).tone).toBe(Tone.Success);
    expect(Enum.meta(EntryKind, EntryKind.Expire).tone).toBe(Tone.Warning);
  });
});
