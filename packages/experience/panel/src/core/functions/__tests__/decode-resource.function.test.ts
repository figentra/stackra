/**
 * Stackra file contract:
 * Purpose: unit tests of `decodeResource` with `encodeResource`: a tree holding every node kind and every SDUI spec
 *          field round-trips through JSON text to an equal tree (refs back by key, enums rebuilt with their case data),
 *          a builder-recorded resource and a manifest entry decode, and a malformed tree or an unknown key is refused
 *          with every problem listed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 5 and 7); build-list item 54 (STA-1981).
 */
import { actionRef, queryRef } from "@stackra/clients";
import type { AnyClass } from "@stackra/container";
import { ApiArea, Enum, SortDirection, Tone } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { Resource } from "#core/bases/resource.base";
import { ActionPlace } from "#core/enums/action-place.enum";
import { Count } from "#core/enums/count.enum";
import { ExportFormat } from "#core/enums/export-format.enum";
import { FieldControl } from "#core/enums/field-control.enum";
import { FilterComparison } from "#core/enums/filter-comparison.enum";
import { FilterKind } from "#core/enums/filter-kind.enum";
import { ImportMode } from "#core/enums/import-mode.enum";
import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { ResourcePage } from "#core/enums/resource-page.enum";
import { ResourceWireInvalidError } from "#core/errors/resource-wire-invalid.error";
import { decodeResource } from "#core/functions/decode-resource.function";
import { describeResource } from "#core/functions/describe-resource.function";
import { encodeResource } from "#core/functions/encode-resource.function";
import type { Actions } from "#core/types/actions.type";
import type { ResourceTree } from "#core/types/resource-tree.type";
import type { Table } from "#core/types/table.type";

const OrderStatus = Enum.of({
  Pending: ["pending", { tone: Tone.Warning }],
  Paid: ["paid", { tone: Tone.Success }],
  Void: "void",
});

const ListOrders = queryRef("orders.order.list@1", {
  input: z.object({ limit: z.number() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
});
const GetOrder = queryRef("orders.order.get@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ id: z.string() }),
});
const ListCustomers = queryRef("orders.customer.list@1", {
  input: z.object({ limit: z.number() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
});
const ListLines = queryRef("orders.order_line.list@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
});
const CreateOrder = actionRef("orders.order.create@1", {
  input: z.object({ note: z.string() }),
  output: z.object({ id: z.string() }),
});
const CancelOrder = actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({}),
});
const AttachFile = actionRef("orders.order.attach_file@1", {
  input: z.object({ orderId: z.string(), file: z.string() }),
  output: z.object({}),
});
const ReleaseHold = actionRef("orders.hold.release@1", {
  input: z.object({ holdId: z.string() }),
  output: z.object({}),
});

const REFS: ReadonlyMap<string, AnyClass> = new Map(
  [
    ListOrders,
    GetOrder,
    ListCustomers,
    ListLines,
    CreateOrder,
    CancelOrder,
    AttachFile,
    ReleaseHold,
  ].map((ref): [string, AnyClass] => [ref.key, ref]),
);
const refOf = (key: string): AnyClass | undefined => REFS.get(key);

/** What `run` throws; undefined when it returns. */
const thrownBy = (run: () => unknown): unknown => {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
};

/** `refOf` without the release-hold action and the get query. */
const withoutTwo = (key: string): AnyClass | undefined =>
  key === "orders.hold.release@1" || key === "orders.order.get@1" ? undefined : refOf(key);

const GROUP = "orders::nav.sales" as I18nKey;
const PAID = "orders::enums.order_status.paid" as I18nKey;

/** Every node kind, every operation form and the SDUI spec fields of wave 2. */
const TREE: ResourceTree = {
  options: {
    area: ApiArea.Admin,
    navigation: { group: GROUP, icon: "receipt", order: 20, badge: "awaiting_payment" },
    operations: { list: ListOrders, get: GetOrder, create: CreateOrder, delete: true },
    quickCreate: true,
  },
  table: {
    columns: [
      { kind: "value", key: "id", copyable: true, isRowHeader: true, pin: "start", width: 160 },
      {
        kind: "value",
        key: "status",
        sortable: true,
        enum: OrderStatus,
        labels: { paid: PAID },
        cell: "badge",
        tones: { paid: Tone.Success },
        label: "Status",
        align: "center",
      },
      {
        kind: "money",
        key: "totals.totalMinor",
        currency: "totals.currency",
        aggregate: "sum",
        isEditable: true,
        minWidth: 80,
        maxWidth: 240,
      },
      { kind: "count", key: "lines", hidden: true, isHideable: true, wrap: false, width: "12rem" },
    ],
    filters: [
      {
        kind: "value",
        key: "status",
        enum: OrderStatus,
        default: ["paid"],
        pinned: true,
        control: FilterKind.Choice,
        choices: [{ value: "paid", label: "Paid" }],
      },
      {
        kind: "compare",
        key: "totals.totalMinor",
        operator: FilterComparison.Gte,
        step: 100,
        label: "Total",
        placeholder: "Minimum",
      },
      { kind: "dateRange", key: "createdAt", presets: ["today", "last_7_days"] },
      { kind: "trashed" },
    ],
    defaultSort: { key: "createdAt", direction: SortDirection.Desc },
    thenSort: [{ key: "id", direction: SortDirection.Asc }],
    count: Count.Estimated,
    isStickyHeader: true,
    hasColumnTools: true,
    isColumnResizable: true,
    searchLabel: "Search orders",
    searchPlaceholder: "Number or customer",
    canSaveView: true,
    empty: {
      title: "No orders yet",
      description: "Orders show here once placed.",
      icon: "receipt",
      reason: "no-data",
      headingLevel: 3,
      filtered: { title: "No orders match" },
    },
    rowActions: {
      label: "Order actions",
      sections: [{ label: "Danger", actions: ["orders.order.cancel@1"] }],
      variant: "ghost",
      size: "sm",
      hasHoverActions: true,
    },
    bulkActions: { label: "Bulk", runMode: "once", variant: "floating", export: true },
  },
  views: [
    { name: "awaiting_payment", filter: { status: ["pending"] } },
    {
      name: "archived",
      filter: {},
      sort: { key: "createdAt", direction: SortDirection.Asc },
      input: { includeArchived: true },
    },
  ],
  form: {
    fields: [
      {
        kind: "steps",
        name: "order",
        steps: [
          {
            name: "basics",
            fields: [
              {
                kind: "grid",
                columns: 2,
                fields: [
                  {
                    kind: "value",
                    key: "customerId",
                    options: ListCustomers,
                    optionLabel: "name",
                    span: 2,
                    essential: true,
                  },
                  {
                    kind: "value",
                    key: "status",
                    enum: OrderStatus,
                    control: FieldControl.Radio,
                    choices: [{ value: "paid", label: "Paid" }],
                    visibleWhen: "isDraft",
                  },
                  {
                    kind: "value",
                    key: "discount",
                    minValue: 0,
                    maxValue: 100,
                    step: 5,
                    formatOptions: { style: "percent" },
                    isRequired: false,
                    label: "Discount",
                    description: "A share of the total",
                    placeholder: "0",
                  },
                ],
              },
            ],
          },
          {
            name: "files",
            fields: [
              { kind: "upload", key: "file", action: AttachFile, accept: ["application/pdf"] },
              { kind: "repeater", key: "lines", fields: [{ kind: "value", key: "sku" }] },
            ],
          },
        ],
      },
    ],
  },
  infolist: {
    entries: [
      {
        kind: "section",
        name: "summary",
        aside: true,
        entries: [
          { kind: "value", key: "status", enum: OrderStatus, labels: { paid: PAID } },
          { kind: "principal", key: "customer", copyable: true },
          { kind: "money", key: "totals.totalMinor", currency: "totals.currency" },
          {
            kind: "list",
            key: "lines",
            columns: ["sku", "unitPriceMinor"],
            currency: "totals.currency",
          },
        ],
      },
    ],
  },
  relations: [
    {
      kind: "table",
      query: ListLines,
      columns: [{ kind: "value", key: "sku" }],
      bind: { orderId: "record.id" },
      actions: [ReleaseHold],
    },
  ],
  actions: [
    {
      kind: "run",
      action: CancelOrder,
      bulk: true,
      places: [ActionPlace.Row, ActionPlace.View],
      layer: PlacementLayer.Owner,
      startIcon: "x",
      variant: "danger",
      size: "sm",
      tone: "danger",
      shortcut: "mod+shift+c",
      shortcutId: "orders.cancel",
      permission: "orders.order.cancel",
      confirm: { title: "Cancel the order?", tone: "danger" },
      visibleWhen: "isCancellable",
      description: "Stops the order",
      disabledReason: "Already shipped",
    },
    {
      kind: "export",
      formats: [ExportFormat.Csv],
      columns: ["id"],
      permission: "orders.order.export",
    },
    { kind: "import", mode: ImportMode.Upsert, match: "id", maxRows: 1000 },
    { kind: "create", after: ResourcePage.View, href: "/orders/new", isFullWidth: true },
  ],
};

describe("decodeResource", () => {
  it("round-trips a tree through JSON text to an equal tree", () => {
    const text = JSON.stringify(encodeResource(TREE));
    const decoded = decodeResource("orders.order", JSON.parse(text), refOf);
    expect(decoded).toEqual(TREE);
    expect(decoded.options.operations.list).toBe(ListOrders);
    expect(decoded.relations?.[0]?.actions?.[0]).toBe(ReleaseHold);
    expect(Object.isFrozen(decoded)).toBe(true);
  });

  it("rebuilds each enum with its case data", () => {
    const decoded = decodeResource("orders.order", encodeResource(TREE), refOf);
    const status = decoded.table?.columns[1];
    expect(status?.enum).not.toBe(OrderStatus);
    const rebuilt = status?.enum as typeof OrderStatus;
    expect(Enum.values(rebuilt)).toEqual(["pending", "paid", "void"]);
    expect(Enum.meta(rebuilt, "paid")).toEqual({ tone: Tone.Success });
    expect(Enum.meta(rebuilt, "void")).toEqual({});
  });

  it("decodes a resource the builders recorded", () => {
    class Order {
      id!: string;
    }
    interface OrderRow {
      readonly id: string;
      readonly createdAt: Date;
    }
    class OrderResource extends Resource<Order, OrderRow>({
      area: ApiArea.Admin,
      operations: { list: ListOrders, get: GetOrder },
    }) {
      override table(t: Table<OrderRow>) {
        return t
          .columns((c) => [c.from("id").copyable(), c.from("createdAt").sortable()])
          .filters((f) => [f.trashed()])
          .defaultSort("createdAt", SortDirection.Desc);
      }

      override actions(a: Actions<OrderRow, OrderRow>) {
        return [a.run(CancelOrder).bulk(), a.create().then(ResourcePage.View)];
      }
    }
    const tree = describeResource(OrderResource);
    expect(decodeResource("orders.order", encodeResource(tree), refOf)).toEqual(tree);
  });

  it("decodes a manifest entry as gen writes it, dropping its identity fields", () => {
    const entry = {
      module: "orders",
      class: "OrderResource",
      from: "@acme/orders/node",
      options: { area: "admin", operations: { list: true, create: "orders.order.create@1" } },
      actions: [{ kind: "run", action: "orders.order.cancel@1", bulk: true }],
    };
    expect(decodeResource("orders.order", entry, refOf)).toEqual({
      options: { area: ApiArea.Admin, operations: { list: true, create: CreateOrder } },
      actions: [{ kind: "run", action: CancelOrder, bulk: true }],
    });
  });

  it("refuses a malformed tree, listing every problem with its path", () => {
    const wire = {
      options: { area: "nowhere", operations: { list: "ListOrdersQuery" } },
      table: { columns: [{ kind: "value", key: "bad path" }], filters: [], count: "estimated" },
    };
    const error = thrownBy(() => decodeResource("orders.order", wire, refOf));
    expect(isRefusal(error, ResourceWireInvalidError)).toBe(true);
    const issues = (error as ResourceWireInvalidError).issues;
    expect(issues.some((issue) => issue.startsWith("tree.options.area:"))).toBe(true);
    expect(issues.some((issue) => issue.startsWith("tree.options.operations.list:"))).toBe(true);
    expect(issues.some((issue) => issue.startsWith("tree.table.columns.0.key:"))).toBe(true);
  });

  it("refuses an enum whose codes repeat", () => {
    const wire = {
      options: { area: "admin", operations: {} },
      table: {
        columns: [{ kind: "value", key: "status", enum: { A: "a", B: "a" } }],
        filters: [],
        count: "estimated",
      },
    };
    expect(() => decodeResource("orders.order", wire, refOf)).toThrow(ResourceWireInvalidError);
  });

  it("refuses every key the client has no ref for", () => {
    const wire = encodeResource(TREE);
    const error = thrownBy(() => decodeResource("orders.order", wire, withoutTwo));
    expect(isRefusal(error, ResourceWireInvalidError)).toBe(true);
    expect((error as ResourceWireInvalidError).issues).toEqual([
      'tree.options.operations.get: no client ref for "orders.order.get@1"',
      'tree.relations.0.actions.0: no client ref for "orders.hold.release@1"',
    ]);
  });
});
