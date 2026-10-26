/**
 * Stackra file contract:
 * Purpose: proves the ComboBox contract is two shapes told apart by `selectionMode`: a key that may be `null` for one
 *          choice and a list of keys for several, both with the choices required and the typed text, loading, load-more
 *          and empty-message props optional.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-077 sta-350:FR-078
import type { ComboBoxContractProps } from "#contracts/types/combo-box-contract-props.type";
import type { MultipleComboBoxContractProps } from "#contracts/types/multiple-combo-box-contract-props.type";
import type { SingleComboBoxContractProps } from "#contracts/types/single-combo-box-contract-props.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

describe("ComboBoxContractProps", () => {
  it("is the field contract over a key, or over a list of keys in multiple mode", () => {
    expectTypeOf<SingleComboBoxContractProps>().toExtend<FieldContractProps<string | null>>();
    expectTypeOf<MultipleComboBoxContractProps>().toExtend<FieldContractProps<readonly string[]>>();
    expectTypeOf<ComboBoxContractProps>().toEqualTypeOf<
      SingleComboBoxContractProps | MultipleComboBoxContractProps
    >();
  });

  it("tells the shapes apart by the selection mode, one being the default", () => {
    expectTypeOf<SingleComboBoxContractProps["selectionMode"]>().toEqualTypeOf<
      "single" | undefined
    >();
    expectTypeOf<MultipleComboBoxContractProps["selectionMode"]>().toEqualTypeOf<"multiple">();
  });

  it("requires the choices, and the mode only for several", () => {
    expectTypeOf<{ items: readonly SelectItem[] }>().toExtend<SingleComboBoxContractProps>();
    expectTypeOf<{ items: readonly SelectItem[] }>().not.toExtend<MultipleComboBoxContractProps>();
    expectTypeOf<Record<never, never>>().not.toExtend<ComboBoxContractProps>();
  });

  it("types the typed text, the loading state and the load-more request", () => {
    expectTypeOf<SingleComboBoxContractProps["inputValue"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<SingleComboBoxContractProps["onInputChange"]>().toEqualTypeOf<
      ((text: string) => void) | undefined
    >();
    expectTypeOf<SingleComboBoxContractProps["onLoadMore"]>().toEqualTypeOf<
      (() => void) | undefined
    >();
    expectTypeOf<SingleComboBoxContractProps["isLoading"]>().toEqualTypeOf<boolean | undefined>();
  });
});
