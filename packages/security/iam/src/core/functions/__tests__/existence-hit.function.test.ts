/**
 * Stackra file contract:
 * Purpose: unit tests of `existenceHit`: the full record when `see` allows, an existence-only hit when only `exists`
 *          allows, nothing otherwise (abstain hides).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0333; STA-595.
 */
import { describe, expect, it } from "@stackra/testing";

import { Decision } from "#core/enums/decision.enum";
import { existenceHit } from "#core/functions/existence-hit.function";

const matter = { id: "mat_1", title: "Acme v Globex" } as const;

describe("existenceHit", () => {
  it("shows the record, its existence, or nothing", () => {
    expect(
      existenceHit(matter, matter.id, "matters.matter", Decision.Allow, Decision.Deny),
    ).toEqual({
      kind: "full",
      record: matter,
    });
    expect(
      existenceHit(matter, matter.id, "matters.matter", Decision.Deny, Decision.Allow),
    ).toEqual({
      kind: "exists",
      id: "mat_1",
      model: "matters.matter",
    });
    expect(
      existenceHit(matter, matter.id, "matters.matter", Decision.Abstain, Decision.Abstain),
    ).toBeNull();
  });
});
