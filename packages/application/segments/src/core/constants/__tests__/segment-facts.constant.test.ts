/**
 * Stackra file contract:
 * Purpose: unit tests of `SEGMENT_FACTS`: a rules registry accepts it, and a condition on `segments.ids` checks.
 * Boundary: test only; the registry is a real `@stackra/rules` value.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decision 4); ADR 0462 (decision 1).
 */
import { Rules } from "@stackra/rules";
import { FieldType, Operator } from "@stackra/rules/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SEGMENT_FACTS } from "#core/constants/segment-facts.constant";

describe("SEGMENT_FACTS", () => {
  it("registers on a rules registry and lets a rule test membership", () => {
    const rules = Rules.create({ key: "orders.cancel", sources: [SEGMENT_FACTS] });
    expect(SEGMENT_FACTS.fields.ids.type).toBe(FieldType.List);
    expect(
      rules.check({
        field: "segments.ids",
        operator: Operator.Includes,
        value: "seg_01j9z3k4m5n6p7q8r9s0t1v2v1",
      }),
    ).toEqual({
      field: "segments.ids",
      operator: Operator.Includes,
      value: "seg_01j9z3k4m5n6p7q8r9s0t1v2v1",
    });
    expect(Object.isFrozen(SEGMENT_FACTS)).toBe(true);
  });
});
