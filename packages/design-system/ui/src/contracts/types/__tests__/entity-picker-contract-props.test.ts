/**
 * Stackra file contract:
 * Purpose: proves the EntityPicker contract: both forms ask for records through `loadOptions(search, cursor)`, the
 *          single form holds one record or `null` and has no remove label, the multiple form holds a list of records
 *          and must name its remove buttons, and the field props of the contract are shared by both.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0318 (wave 7 vocabulary); ADR 0022 (test placement).
 */
// @covers sta-350:FR-198
import type { EntityOption } from "#contracts/types/entity-option.type";
import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";
import type {
  EntityPickerContractProps,
  MultipleEntityPickerContractProps,
  SingleEntityPickerContractProps,
} from "#contracts/types/entity-picker-contract-props.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

describe("EntityPickerContractProps", () => {
  it("asks for records a page at a time, by search text and cursor", () => {
    expectTypeOf<SingleEntityPickerContractProps["loadOptions"]>().toEqualTypeOf<
      (search: string, cursor?: string) => Promise<EntityOptionPage>
    >();
    expectTypeOf<MultipleEntityPickerContractProps["loadOptions"]>().toEqualTypeOf<
      SingleEntityPickerContractProps["loadOptions"]
    >();
  });

  it("holds one record or null in single mode, and a list of records in multiple mode", () => {
    expectTypeOf<SingleEntityPickerContractProps>().toExtend<
      FieldContractProps<EntityOption | null>
    >();
    expectTypeOf<MultipleEntityPickerContractProps>().toExtend<
      FieldContractProps<readonly EntityOption[]>
    >();
  });

  it("makes a multiple picker name its remove buttons and a single one have none", () => {
    expectTypeOf<MultipleEntityPickerContractProps["removeLabel"]>().toEqualTypeOf<
      (entityLabel: string) => string
    >();
    expectTypeOf<SingleEntityPickerContractProps["removeLabel"]>().toEqualTypeOf<undefined>();
  });

  it("tells the two forms apart by the selection mode", () => {
    expectTypeOf<EntityPickerContractProps["selectionMode"]>().toEqualTypeOf<
      "single" | "multiple" | undefined
    >();
  });
});
