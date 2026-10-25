/**
 * Stackra file contract:
 * Purpose: unit tests of `Entry`: value, principal, money and list entry nodes, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { Entry } from "#core/constants/entry.constant";

describe("Entry", () => {
  it("builds frozen entry nodes", () => {
    expect(Entry.from("id", { copyable: true })).toEqual({
      kind: "value",
      key: "id",
      copyable: true,
    });
    expect(Entry.principal("actor")).toEqual({ kind: "principal", key: "actor" });
    expect(Entry.money("total", { currency: "currency" })).toEqual({
      kind: "money",
      key: "total",
      currency: "currency",
    });
    const list = Entry.list("variants", { columns: ["id", "sku"] });
    expect(list).toEqual({ kind: "list", key: "variants", columns: ["id", "sku"] });
    expect(Object.isFrozen(list)).toBe(true);
  });
});
