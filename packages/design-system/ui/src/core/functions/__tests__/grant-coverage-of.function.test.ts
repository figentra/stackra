/**
 * Stackra file contract:
 * Purpose: proves `grantCoverageOf` counts the granted role-permission pairs and reports all, some or none, and that
 *          an empty set is never "all".
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
import { grantCoverageOf } from "#core/functions/grant-coverage-of.function";

const GRANTS = { cashier: ["sell", "refund"], manager: ["sell"] };

describe("grantCoverageOf", () => {
  it("counts pairs across roles and permissions", () => {
    expect(grantCoverageOf(GRANTS, ["cashier"], ["sell", "refund"])).toEqual({
      count: 2,
      total: 2,
      isAll: true,
      isSome: false,
    });
    expect(grantCoverageOf(GRANTS, ["cashier", "manager"], ["sell", "refund"])).toEqual({
      count: 3,
      total: 4,
      isAll: false,
      isSome: true,
    });
    expect(grantCoverageOf(GRANTS, ["owner"], ["sell"])).toMatchObject({ count: 0, isSome: false });
  });

  it("is never all for an empty set", () => {
    expect(grantCoverageOf(GRANTS, ["cashier"], [])).toMatchObject({ total: 0, isAll: false });
  });
});
