/**
 * Stackra file contract:
 * Purpose: proves the shared wave 7 contracts compose: a resource action is a menu leaf whose handler may return a
 *          promise, a quick filter is one condition of the `CollectionFilter` (the operators added for it), each
 *          filter kind has its own value type and its own definition, a number filter reuses NumberField's bounds, and
 *          the date and number field props are field contracts over a calendar day and a number that may be empty.
 * Boundary: type assertions and one tuple check; the assertions are checked by the typechecker.
 * Runtime: node
 * Governing contract: ADR 0318; ADR 0505 (one filter model); ADR 0022 (test placement).
 */
// @covers sta-350:FR-185 sta-350:FR-186
import type { CalendarDate } from "@internationalized/date";

import { FilterKind } from "#contracts/enums/filter-kind.enum";
import { RuleOperator } from "#contracts/enums/rule-operator.enum";
import type { AllMatchingSelectionContractProps } from "#contracts/types/all-matching-selection-contract-props.type";
import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import type { DateValueContractProps } from "#contracts/types/date-value-contract-props.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { NumberFilterDefinition } from "#contracts/types/number-filter-definition.type";
import type { FilterValueByKind } from "#contracts/types/filter-value-by-kind.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";
import type { NumberRangeValue } from "#contracts/types/number-range-value.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";
import type { RuleCondition } from "#contracts/types/rule-condition.type";

describe("resource index contracts", () => {
  it("makes a resource action a menu leaf whose handler may return a promise", () => {
    expectTypeOf<ResourceAction>().toExtend<Omit<MenuLeafItem, "onPress">>();
    expectTypeOf<ResourceAction["onPress"]>().toEqualTypeOf<
      (() => void | Promise<void>) | undefined
    >();
    expectTypeOf<ResourceAction>().toExtend<MenuLeafItem>();
  });

  it("offers select-all-matching as three optional props", () => {
    expectTypeOf<AllMatchingSelectionContractProps["totalCount"]>().toEqualTypeOf<
      number | undefined
    >();
    expectTypeOf<Record<never, never>>().toExtend<AllMatchingSelectionContractProps>();
  });

  it("writes a quick filter as one condition: a list, a range or a flag", () => {
    expect(RuleOperator).toEqual(
      expect.arrayContaining(["in", "not_in", "between", "before", "after", "is_true", "is_false"]),
    );
    expectTypeOf<RuleCondition["value"]>().toEqualTypeOf<string | readonly string[]>();
  });

  it("has six filter kinds, each with its own value type", () => {
    expect(FilterKind).toEqual([
      "text",
      "number",
      "select",
      "multi-select",
      "date-range",
      "boolean",
    ]);
    expectTypeOf<FilterValueByKind["text"]>().toEqualTypeOf<string>();
    expectTypeOf<FilterValueByKind["number"]>().toEqualTypeOf<NumberRangeValue>();
    expectTypeOf<FilterValueByKind["multi-select"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<FilterValueByKind["date-range"]>().toEqualTypeOf<DateRangeValue>();
    expectTypeOf<keyof FilterValueByKind>().toEqualTypeOf<FilterKind>();
  });

  it("tells a filter definition apart by its kind and reuses NumberField's bounds for a number filter", () => {
    expectTypeOf<FilterDefinition["kind"]>().toEqualTypeOf<FilterKind>();
    expectTypeOf<NumberFilterDefinition["minValue"]>().toEqualTypeOf<
      NumberFieldContractProps["minValue"]
    >();
    expectTypeOf<NumberFilterDefinition["formatOptions"]>().toEqualTypeOf<
      Intl.NumberFormatOptions | undefined
    >();
  });
});

describe("number and date field contracts", () => {
  it("makes a number field a field over a number that may be empty", () => {
    expectTypeOf<NumberFieldContractProps>().toExtend<FieldContractProps<number | null>>();
    expectTypeOf<NumberFieldContractProps["hasSteppers"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("makes the date props a field over a calendar day that may be empty, with a day-based bound and refusal", () => {
    expectTypeOf<DateValueContractProps>().toExtend<FieldContractProps<CalendarDate | null>>();
    expectTypeOf<DateValueContractProps["minValue"]>().toEqualTypeOf<CalendarDate | undefined>();
    expectTypeOf<DateValueContractProps["isDateUnavailable"]>().toEqualTypeOf<
      ((date: CalendarDate) => boolean) | undefined
    >();
  });

  it("makes the picker the day props plus the overlay open state and a named calendar button", () => {
    expectTypeOf<DatePickerContractProps>().toExtend<DateValueContractProps>();
    expectTypeOf<DatePickerContractProps>().toExtend<OpenStateContractProps>();
    expectTypeOf<DatePickerContractProps["calendarButtonLabel"]>().toEqualTypeOf<
      string | undefined
    >();
  });
});
