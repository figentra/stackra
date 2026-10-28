/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/panel` (and the old
 *          `./schemas` folded in) is exported, nothing else is, the `$` names are the shipped schemas, and the public
 *          types the template names resolve.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); registry note A3 (one symbol, one entry).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { COUNT_METRIC_SCHEMA } from "#core/constants/count-metric-schema.constant";
import { MONEY_METRIC_SCHEMA } from "#core/constants/money-metric-schema.constant";
import { SAVED_VIEW_SCHEMA } from "#core/constants/saved-view-schema.constant";
import { TIME_RANGE_INPUT_SCHEMA } from "#core/constants/time-range-input-schema.constant";
import * as panel from "#core/index";
import type {
  Actions,
  CreateInput,
  Display,
  Form,
  Infolist,
  Relations,
  Table,
  Views,
} from "#core/index";

describe("@stackra/panel", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(panel).sort()).toEqual([
      "ActionPlace",
      "Aggregate",
      "Bind",
      "Blocks",
      "Column",
      "Count",
      "CountMetric",
      "CountMetric$",
      "DateRange",
      "DisplayKind",
      "Document",
      "DocumentLayout",
      "Drill",
      "Entry",
      "ExportFormat",
      "Filter",
      "FilterComparison",
      "FormField",
      "FormStep",
      "ImportMode",
      "MoneyMetric",
      "MoneyMetric$",
      "Panel",
      "Place",
      "Placement",
      "PlacementLayer",
      "Relation",
      "Resource",
      "ResourcePage",
      "SavedView",
      "SavedView$",
      "Section",
      "TimeRange",
      "TimeRangeInput",
      "TimeRangeInput$",
      "View",
      "ViewSharing",
      "Widget",
      "WidgetDisplay",
      "WidgetSize",
      "activeContributions",
      "defineSlot",
      "describeResource",
      "describeWidget",
      "document",
      "fieldsForMode",
      "fillSlot",
      "groupRows",
      "lineEditorOf",
      "panels",
      "registerResources",
      "registerWidgets",
      "resolvePlacements",
      "resource",
      "slots",
      "widget",
    ]);
  });

  it("exports the shipped schemas under their generated names", () => {
    expect(panel.CountMetric$).toBe(COUNT_METRIC_SCHEMA);
    expect(panel.MoneyMetric$).toBe(MONEY_METRIC_SCHEMA);
    expect(panel.SavedView$).toBe(SAVED_VIEW_SCHEMA);
    expect(panel.TimeRangeInput$).toBe(TIME_RANGE_INPUT_SCHEMA);
  });

  it("resolves the builder types the template names", () => {
    expectTypeOf<Table<{ id: string }>>().toHaveProperty("columns");
    expectTypeOf<Views<{ id: string }>>().toHaveProperty("view");
    expectTypeOf<Form<CreateInput<{ title: string }>>>().toHaveProperty("fields");
    expectTypeOf<Infolist<{ id: string }>>().toHaveProperty("entries");
    expectTypeOf<Relations<{ id: string }>>().toHaveProperty("table");
    expectTypeOf<Actions<{ id: string }, { id: string }>>().toHaveProperty("run");
    expectTypeOf<Display<{ id: string }>>().toHaveProperty("kpi");
  });
});
