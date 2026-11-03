/**
 * Stackra file contract:
 * Purpose: `RESOURCE_WIRE_SCHEMA`, the zod schema of `ResourceWire` this package ships (its `ResourceWire$`): the options
 *          with the navigation entry and the operations, the table with its columns, filters, sorts and look (the empty
 *          state, the row menu and the bulk bar), the preset views, the form, the infolist, the relation managers and
 *          the placed buttons with their `ActionButtonSpec` look.
 * Boundary: a resource tree sent as JSON is input at the client's boundary, so every field is checked: classes are
 *           versioned keys, enums are `Enum.of` definitions with unique codes, paths are row paths, the closed sets are
 *           their enums' codes, icons are icon names and filter defaults and view inputs are JSON. Unknown fields (a
 *           manifest entry's `module`, `class`, `from`) are dropped. Whether a key has a client ref is `decodeResource`'s
 *           check, not this schema's.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 to 13); ADR 0164 (decision 2); ADR 0504; the SDUI catalogue cases `resources`,
 *                     `actionButton`, `formFields`, `tableFilters`, `tableColumns` and `emptyStates` (STA-1981, build-list
 *                     item 54).
 */
import { ApiArea, Enum, SortDirection, Tone } from "@stackra/contracts";
import {
  AggregateKind,
  ButtonVariant,
  ColumnPin,
  EmptyReason,
  HeadingLevel,
  Size,
} from "@stackra/ui/contracts";
import { json } from "@stackra/validation";
import { z, type ZodType } from "zod";

import { ROW_PATH_SCHEMA } from "#core/constants/row-path-schema.constant";
import { ActionPlace } from "#core/enums/action-place.enum";
import { Count } from "#core/enums/count.enum";
import { ExportFormat } from "#core/enums/export-format.enum";
import { FieldControl } from "#core/enums/field-control.enum";
import { FilterComparison } from "#core/enums/filter-comparison.enum";
import { FilterKind } from "#core/enums/filter-kind.enum";
import { ImportMode } from "#core/enums/import-mode.enum";
import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { ResourcePage } from "#core/enums/resource-page.enum";

/** A versioned action or query key (`orders.order.cancel@1`). */
const REF = z
  .string()
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+@[1-9]\d*$/, "must be a versioned key");

/** A snake_case name (a view, a section, a step). */
const NAME = z.string().regex(/^[a-z][a-z0-9_]*$/, "must be a snake_case name");

/** An icon, by name. */
const ICON = z.string().min(1);

/** An enum as its `Enum.of` definition, codes non-empty and unique. */
const ENUM = z
  .record(
    z.string().min(1),
    z.union([z.string().min(1), z.tuple([z.string().min(1), z.record(z.string(), json())])]),
  )
  .superRefine((definition, issues) => {
    const codes = Object.values(definition).map((value) =>
      typeof value === "string" ? value : value[0],
    );
    if (new Set(codes).size !== codes.length)
      issues.addIssue({ code: "custom", message: "an enum code is used by more than one case" });
  });

/** A choice of a select-like control or a filter, with its words. */
const CHOICE = z.object({ value: z.string(), label: z.string() });

/** The label key of each enum code. */
const LABELS = z.record(z.string(), z.string().min(1));

/** A sort key and its direction. */
const SORT = z.object({
  key: ROW_PATH_SCHEMA,
  direction: z.enum(Enum.values(SortDirection)),
});

/** A placed button's look: `ActionButtonSpec` without `action` and `place`. */
const BUTTON_LOOK = {
  label: z.string().exactOptional(),
  startIcon: ICON.exactOptional(),
  endIcon: ICON.exactOptional(),
  variant: z.enum(ButtonVariant).exactOptional(),
  size: z.enum(Size).exactOptional(),
  isDisabled: z.boolean().exactOptional(),
  isLoading: z.boolean().exactOptional(),
  isFullWidth: z.boolean().exactOptional(),
  shortcut: z.string().min(1).exactOptional(),
  shortcutId: z.string().min(1).exactOptional(),
  disabledReason: z.string().exactOptional(),
  description: z.string().exactOptional(),
  tone: z.enum(["default", "danger"]).exactOptional(),
  href: z.string().min(1).exactOptional(),
  permission: z.string().min(1).exactOptional(),
  confirm: z
    .object({
      title: z.string(),
      description: z.string().exactOptional(),
      tone: z.literal("danger").exactOptional(),
    })
    .exactOptional(),
  visibleWhen: ROW_PATH_SCHEMA.exactOptional(),
};

/** A column: its render kind, row path and flags, with its `TableColumnSpec` look. */
const COLUMN = z.object({
  kind: z.enum(["value", "principal", "money", "count"]),
  key: ROW_PATH_SCHEMA,
  copyable: z.boolean().exactOptional(),
  sortable: z.boolean().exactOptional(),
  hidden: z.boolean().exactOptional(),
  currency: z.string().min(1).exactOptional(),
  enum: ENUM.exactOptional(),
  labels: LABELS.exactOptional(),
  label: z.string().exactOptional(),
  align: z.enum(["start", "center", "end"]).exactOptional(),
  width: z.union([z.number().positive(), z.string().min(1)]).exactOptional(),
  minWidth: z.number().positive().exactOptional(),
  maxWidth: z.number().positive().exactOptional(),
  pin: z.enum(ColumnPin).exactOptional(),
  wrap: z.boolean().exactOptional(),
  isResizable: z.boolean().exactOptional(),
  isRowHeader: z.boolean().exactOptional(),
  isHideable: z.boolean().exactOptional(),
  isEditable: z.boolean().exactOptional(),
  aggregate: z.enum(AggregateKind).exactOptional(),
  cell: z
    .enum(["text", "badge", "status", "money", "principal", "date", "link", "copy"])
    .exactOptional(),
  tones: z.record(z.string(), z.enum(Enum.values(Tone))).exactOptional(),
});

/** A filter: the trashed filter, or a field filter with its `FilterSpec` look. */
const FILTER = z.union([
  z.object({ kind: z.literal("trashed") }),
  z.object({
    kind: z.enum(["value", "principal", "range", "dateRange", "compare", "contains", "isNull"]),
    key: ROW_PATH_SCHEMA,
    default: json().exactOptional(),
    pinned: z.boolean().exactOptional(),
    enum: ENUM.exactOptional(),
    operator: z.enum(Enum.values(FilterComparison)).exactOptional(),
    control: z.enum(Enum.values(FilterKind)).exactOptional(),
    label: z.string().exactOptional(),
    placeholder: z.string().exactOptional(),
    isDisabled: z.boolean().exactOptional(),
    step: z.number().positive().exactOptional(),
    trueLabel: z.string().exactOptional(),
    falseLabel: z.string().exactOptional(),
    choices: z.array(CHOICE).exactOptional(),
    presets: z.array(z.string().min(1)).exactOptional(),
  }),
]);

/** A table: columns, filters, sorts, count mode and look. */
const TABLE = z.object({
  columns: z.array(COLUMN),
  filters: z.array(FILTER),
  defaultSort: SORT.exactOptional(),
  thenSort: z.array(SORT).max(2).exactOptional(),
  count: z.enum(Enum.values(Count)),
  isStickyHeader: z.boolean().exactOptional(),
  hasColumnTools: z.boolean().exactOptional(),
  isColumnResizable: z.boolean().exactOptional(),
  searchPlaceholder: z.string().exactOptional(),
  searchLabel: z.string().exactOptional(),
  canSaveView: z.boolean().exactOptional(),
  empty: z
    .object({
      title: z.string().exactOptional(),
      description: z.string().exactOptional(),
      icon: z.union([ICON, z.literal(false)]).exactOptional(),
      reason: z.enum(EmptyReason).exactOptional(),
      headingLevel: z.literal([...HeadingLevel]).exactOptional(),
      filtered: z
        .object({ title: z.string(), description: z.string().exactOptional() })
        .exactOptional(),
    })
    .exactOptional(),
  rowActions: z
    .object({
      sections: z
        .array(z.object({ label: z.string().exactOptional(), actions: z.array(z.string().min(1)) }))
        .exactOptional(),
      label: z.string().exactOptional(),
      icon: ICON.exactOptional(),
      variant: z.enum(ButtonVariant).exactOptional(),
      size: z.enum(Size).exactOptional(),
      hasHoverActions: z.boolean().exactOptional(),
    })
    .exactOptional(),
  bulkActions: z
    .object({
      label: z.string().exactOptional(),
      clearLabel: z.string().exactOptional(),
      moreActionsLabel: z.string().exactOptional(),
      variant: z.enum(["inline", "floating"]).exactOptional(),
      runMode: z.enum(["per-record", "once"]).exactOptional(),
      allowSelectAllMatching: z.boolean().exactOptional(),
      export: z.boolean().exactOptional(),
    })
    .exactOptional(),
});

/** A preset view. */
const VIEW = z.object({
  name: NAME,
  filter: z.record(z.string(), json()),
  sort: SORT.exactOptional(),
  input: z.record(z.string(), json()).exactOptional(),
});

/** A form element; elements nest in repeaters, grids and steps. */
const FIELD: ZodType = z.lazy(() =>
  z.union([
    z.object({
      kind: z.literal("value"),
      key: ROW_PATH_SCHEMA,
      span: z.number().int().positive().exactOptional(),
      enum: ENUM.exactOptional(),
      options: REF.exactOptional(),
      optionLabel: ROW_PATH_SCHEMA.exactOptional(),
      essential: z.boolean().exactOptional(),
      label: z.string().exactOptional(),
      description: z.string().exactOptional(),
      placeholder: z.string().exactOptional(),
      isRequired: z.boolean().exactOptional(),
      isDisabled: z.boolean().exactOptional(),
      isReadOnly: z.boolean().exactOptional(),
      control: z.enum(Enum.values(FieldControl)).exactOptional(),
      minValue: z.number().exactOptional(),
      maxValue: z.number().exactOptional(),
      step: z.number().positive().exactOptional(),
      formatOptions: z.record(z.string(), json()).exactOptional(),
      visibleWhen: ROW_PATH_SCHEMA.exactOptional(),
      choices: z.array(CHOICE).exactOptional(),
    }),
    z.object({
      kind: z.literal("upload"),
      key: ROW_PATH_SCHEMA,
      action: REF,
      accept: z.array(z.string().min(1)).exactOptional(),
      maxBytes: z.number().int().positive().exactOptional(),
      essential: z.boolean().exactOptional(),
    }),
    z.object({ kind: z.literal("repeater"), key: ROW_PATH_SCHEMA, fields: z.array(FIELD) }),
    z.object({
      kind: z.literal("grid"),
      columns: z.number().int().positive(),
      fields: z.array(FIELD),
    }),
    z.object({
      kind: z.literal("steps"),
      name: NAME,
      steps: z.array(z.object({ name: NAME, fields: z.array(FIELD) })),
    }),
  ]),
);

/** An infolist element; entries nest in sections. */
const ENTRY: ZodType = z.lazy(() =>
  z.union([
    z.object({
      kind: z.enum(["value", "principal"]),
      key: ROW_PATH_SCHEMA,
      copyable: z.boolean().exactOptional(),
      enum: ENUM.exactOptional(),
      labels: LABELS.exactOptional(),
    }),
    z.object({
      kind: z.literal("money"),
      key: ROW_PATH_SCHEMA,
      currency: ROW_PATH_SCHEMA,
      copyable: z.boolean().exactOptional(),
    }),
    z.object({
      kind: z.literal("list"),
      key: ROW_PATH_SCHEMA,
      columns: z.array(ROW_PATH_SCHEMA),
      currency: ROW_PATH_SCHEMA.exactOptional(),
      labels: z.record(z.string(), LABELS).exactOptional(),
    }),
    z.object({
      kind: z.literal("section"),
      name: NAME,
      entries: z.array(ENTRY),
      aside: z.boolean().exactOptional(),
    }),
  ]),
);

/** A relation manager. */
const RELATION = z.object({
  kind: z.literal("table"),
  query: REF,
  columns: z.array(COLUMN),
  bind: z.record(z.string(), z.string().min(1)).exactOptional(),
  actions: z.array(REF).exactOptional(),
});

/** What every placed button carries besides its kind. */
const PLACED = {
  places: z.array(z.enum(Enum.values(ActionPlace))).exactOptional(),
  layer: z.enum(Enum.values(PlacementLayer)).exactOptional(),
  ...BUTTON_LOOK,
};

/** A placed button: an action run, an export, an import or the create button. */
const PLACEMENT = z.union([
  z.object({ kind: z.literal("run"), action: REF, bulk: z.boolean().exactOptional(), ...PLACED }),
  z.object({
    kind: z.literal("export"),
    formats: z.array(z.enum(Enum.values(ExportFormat))),
    columns: z.array(ROW_PATH_SCHEMA).exactOptional(),
    ...PLACED,
  }),
  z.object({
    kind: z.literal("import"),
    mode: z.enum(Enum.values(ImportMode)),
    match: ROW_PATH_SCHEMA,
    maxRows: z.number().int().positive().exactOptional(),
    ...PLACED,
  }),
  z.object({
    kind: z.literal("create"),
    after: z.enum(Enum.values(ResourcePage)).exactOptional(),
    ...PLACED,
  }),
]);

/** An operation: `true` for the one gen writes, or the versioned key of the query or action. */
const OPERATION = z.union([z.literal(true), REF]).exactOptional();

/** The shipped `ResourceWire$`. */
export const RESOURCE_WIRE_SCHEMA = z.object({
  options: z.object({
    area: z.enum(Enum.values(ApiArea)),
    navigation: z
      .object({
        group: z.string().min(1),
        icon: ICON,
        order: z.number().exactOptional(),
        badge: NAME.exactOptional(),
      })
      .exactOptional(),
    operations: z.object({
      list: OPERATION,
      get: OPERATION,
      create: OPERATION,
      update: OPERATION,
      delete: OPERATION,
    }),
    quickCreate: z.boolean().exactOptional(),
  }),
  table: TABLE.exactOptional(),
  views: z.array(VIEW).exactOptional(),
  form: z.object({ fields: z.array(FIELD) }).exactOptional(),
  infolist: z.object({ entries: z.array(ENTRY) }).exactOptional(),
  relations: z.array(RELATION).exactOptional(),
  actions: z.array(PLACEMENT).exactOptional(),
});
