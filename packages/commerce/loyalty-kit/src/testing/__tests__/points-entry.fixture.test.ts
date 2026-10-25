/**
 * Stackra file contract:
 * Purpose: unit tests of `pointsEntry`: a 100-point earn of `usr_1` by default, any field overridden, references
 *          numbered.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { pointsEntry } from "#testing/points-entry.fixture";

describe("pointsEntry", () => {
  it("builds a 100-point earn of usr_1 and lets overrides win", () => {
    expect(pointsEntry.build()).toMatchObject({
      memberId: "usr_1",
      points: 100,
      kind: EntryKind.Earn,
    });
    expect(pointsEntry.build({ points: -50, kind: EntryKind.Redeem })).toMatchObject({
      points: -50,
      kind: EntryKind.Redeem,
    });
  });

  it("numbers the references", () => {
    const references = pointsEntry.buildMany(3).map((entry) => entry.reference);
    expect(new Set(references).size).toBe(3);
    for (const reference of references) expect(reference).toMatch(/^ord_\d+$/);
  });
});
