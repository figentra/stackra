/**
 * Stackra file contract:
 * Purpose: unit tests of `FieldType`: the seven types of ADR 0331, each with its fixed operator set, every set frozen
 *          and holding the presence tests, and every operator in at least one set.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decisions 3 and 11).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FieldType } from "#contracts/enums/field-type.enum";
import { Operator } from "#contracts/enums/operator.enum";

/** The operator set of a type. */
const operatorsOf = (type: FieldType) => Enum.meta(FieldType, type).operators;

describe("FieldType", () => {
  it("has the seven types of ADR 0331", () => {
    expect(Enum.values(FieldType)).toEqual([
      "string",
      "number",
      "money",
      "date",
      "enum",
      "list",
      "geo",
    ]);
  });

  it("gives every type a frozen set with the presence tests", () => {
    for (const type of Enum.values(FieldType)) {
      expect(Object.isFrozen(operatorsOf(type))).toBe(true);
      expect(operatorsOf(type)).toContain(Operator.IsSet);
      expect(operatorsOf(type)).toContain(Operator.IsNotSet);
    }
  });

  it("fixes the operators of each type", () => {
    expect(operatorsOf(FieldType.Money)).toEqual(operatorsOf(FieldType.Number));
    expect(operatorsOf(FieldType.Number)).toContain(Operator.Between);
    expect(operatorsOf(FieldType.String)).toContain(Operator.StartsWith);
    expect(operatorsOf(FieldType.String)).not.toContain(Operator.LessThan);
    expect(operatorsOf(FieldType.Date)).toContain(Operator.WithinLast);
    expect(operatorsOf(FieldType.Date)).not.toContain(Operator.Equals);
    expect(operatorsOf(FieldType.Enum)).not.toContain(Operator.Contains);
    expect(operatorsOf(FieldType.List)).toContain(Operator.IncludesNone);
    expect(operatorsOf(FieldType.Geo)).toEqual([
      Operator.WithinRadius,
      Operator.OutsideRadius,
      Operator.IsSet,
      Operator.IsNotSet,
    ]);
  });

  it("uses every operator in some set", () => {
    const used = new Set(Enum.values(FieldType).flatMap(operatorsOf));
    expect([...used].sort()).toEqual(Enum.values(Operator).sort());
  });
});
