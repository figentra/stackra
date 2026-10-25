/**
 * Stackra file contract:
 * Purpose: unit tests of `RowChangeKind`: the three ways a row changes, in order, as an `Enum.of` value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RowChangeKind } from "#contracts/enums/row-change-kind.enum";

describe("RowChangeKind", () => {
  it("lists the change kinds in order", () => {
    expect(Enum.values(RowChangeKind)).toEqual(["created", "updated", "deleted"]);
  });

  it("names each case", () => {
    expect(RowChangeKind.Created).toBe("created");
    expect(RowChangeKind.Updated).toBe("updated");
    expect(RowChangeKind.Deleted).toBe("deleted");
    expectTypeOf<RowChangeKind>().toEqualTypeOf<"created" | "updated" | "deleted">();
  });
});
