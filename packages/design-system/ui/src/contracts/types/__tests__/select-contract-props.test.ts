/**
 * Stackra file contract:
 * Purpose: proves the Select contract is the field contract over a key that may be `null`, with the list of choices
 *          required and the placeholder and full width optional, and that a choice needs only a key and a label.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-075
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { SelectContractProps } from "#contracts/types/select-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

describe("SelectContractProps", () => {
  it("is the field contract over a key that may be null, plus the choices", () => {
    expectTypeOf<SelectContractProps>().toExtend<FieldContractProps<string | null>>();
    expectTypeOf<SelectContractProps["items"]>().toEqualTypeOf<readonly SelectItem[]>();
    expectTypeOf<SelectContractProps["value"]>().toEqualTypeOf<string | null | undefined>();
    expectTypeOf<SelectContractProps["onChange"]>().toEqualTypeOf<
      ((value: string | null) => void) | undefined
    >();
  });

  it("requires the choices and nothing else", () => {
    expectTypeOf<{ items: readonly SelectItem[] }>().toExtend<SelectContractProps>();
    expectTypeOf<Record<never, never>>().not.toExtend<SelectContractProps>();
  });

  it("needs a choice to have only a key and a label", () => {
    expectTypeOf<{ id: string; label: string }>().toExtend<SelectItem>();
    expectTypeOf<{ id: string }>().not.toExtend<SelectItem>();
  });
});
