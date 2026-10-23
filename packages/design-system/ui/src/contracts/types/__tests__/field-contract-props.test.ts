/**
 * Stackra file contract:
 * Purpose: proves the shared field contract names every prop of the vocabulary, leaves each one optional, and types the
 *          value, default value and change handler by what the field edits.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-055
import type { ReactNode } from "react";

import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

describe("FieldContractProps", () => {
  it("has every prop of the vocabulary and requires none", () => {
    expectTypeOf<FieldContractProps<string>>().toHaveProperty("label");
    expectTypeOf<FieldContractProps<string>>().toHaveProperty("description");
    expectTypeOf<FieldContractProps<string>>().toHaveProperty("errorMessage");
    expectTypeOf<FieldContractProps<string>>().toHaveProperty("isRequired");
    expectTypeOf<FieldContractProps<string>>().toHaveProperty("isInvalid");
    expectTypeOf<FieldContractProps<string>>().toHaveProperty("isDisabled");
    expectTypeOf<FieldContractProps<string>>().toHaveProperty("isReadOnly");
    expectTypeOf<FieldContractProps<string>>().toHaveProperty("name");
    expectTypeOf<Record<never, never>>().toExtend<FieldContractProps<string>>();
  });

  it("types the value, the default and the change handler by what the field edits", () => {
    expectTypeOf<FieldContractProps<number>["value"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<FieldContractProps<boolean>["defaultValue"]>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<FieldContractProps<string[]>["onChange"]>().toEqualTypeOf<
      ((value: string[]) => void) | undefined
    >();
    expectTypeOf<FieldContractProps<string>["label"]>().toEqualTypeOf<ReactNode>();
  });
});
