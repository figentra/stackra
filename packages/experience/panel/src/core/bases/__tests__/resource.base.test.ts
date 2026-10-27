/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Resource<M, R?>`: the kind record and its checked options, members that record nothing
 *          until overridden, and a template-shaped resource whose table, views, form, infolist, relations and actions
 *          record the expected nodes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 1 to 13); ADR 0305 (rules 5 and 44).
 */
import { kindOf } from "@stackra/container";
import { ApiArea, SortDirection } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ResourceBase } from "#core/bases/resource-base.base";
import { Resource } from "#core/bases/resource.base";
import { Bind } from "#core/constants/bind.constant";
import { DateRange } from "#core/constants/date-range.constant";
import { ActionPlace } from "#core/enums/action-place.enum";
import { ExportFormat } from "#core/enums/export-format.enum";
import { ImportMode } from "#core/enums/import-mode.enum";
import { ResourcePage } from "#core/enums/resource-page.enum";
import { describeResource } from "#core/functions/describe-resource.function";
import type { Actions } from "#core/types/actions.type";
import type { CreateInput } from "#core/types/create-input.type";
import type { Form } from "#core/types/form.type";
import type { Infolist } from "#core/types/infolist.type";
import type { Relations } from "#core/types/relations.type";
import type { Table } from "#core/types/table.type";
import type { Views } from "#core/types/views.type";

/** Stands in for the icon constants gen emits in an app. */
const TestIcons = {
  Receipt: "receipt",
} as const;

/** A model stand-in. */
class Order {
  id!: string;

  status!: string;

  record(): void {}
}

/** A list row stand-in. */
interface OrderView {
  readonly id: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly totals: { readonly totalMinor: number; readonly currency: string };
  readonly lines: readonly { readonly sku: string; readonly quantity: number }[];
}

/** A product model stand-in with a repeater field. */
class Product {
  id!: string;

  title!: string;

  slug!: string;

  variants!: { sku: string; barcode: string }[];
}

class ListOrdersQuery {}
class GetOrderQuery {}
class ListOrderLinesQuery {
  async handle(): Promise<{ items: { sku: string; quantity: number; unitPriceMinor: number }[] }> {
    return { items: [] };
  }
}
class CancelOrderAction {}
class AttachImageAction {}

const GROUP = "orders::nav.sales" as I18nKey;

class OrderResource extends Resource<Order, OrderView>({
  area: ApiArea.Admin,
  navigation: { group: GROUP, icon: TestIcons.Receipt, order: 20, badge: "awaiting_payment" },
  operations: { list: ListOrdersQuery, get: GetOrderQuery },
}) {
  override table(t: Table<OrderView>) {
    return t
      .columns((c) => [
        c.from("id").copyable(),
        c.money("totals.totalMinor", { currency: "totals.currency" }).sortable(),
        c.count("lines"),
        c.from("createdAt").sortable().hidden(),
      ])
      .filters((f) => [f.from("status").default(["paid"]).pinned(), f.trashed()])
      .defaultSort("createdAt", SortDirection.Desc);
  }

  override views(v: Views<OrderView>) {
    return [
      v
        .view("paid_today", { status: ["paid"], createdAt: DateRange.today() })
        .sort("createdAt", SortDirection.Desc),
    ];
  }

  override infolist(i: Infolist<OrderView>) {
    return i.entries((e) => [
      e.section("summary", [e.from("id").copyable(), e.principal("status")]),
      e
        .section("totals", [
          e.money("totals.totalMinor", { currency: "totals.currency" }),
          e.list("lines", ["sku"]),
        ])
        .aside(),
    ]);
  }

  override relations(r: Relations<OrderView>) {
    return [
      r.table(ListOrderLinesQuery, (c) => [
        c.from("sku"),
        c.money("unitPriceMinor", { currency: Bind.record("totals.currency") }),
      ]),
    ];
  }

  override actions(a: Actions<OrderView, OrderView>) {
    return [
      a.run(CancelOrderAction).bulk(),
      a.run(AttachImageAction).in(ActionPlace.View, ActionPlace.Edit),
      a.export({ formats: [ExportFormat.Csv, ExportFormat.Xlsx] }),
      a
        .import({ mode: ImportMode.Upsert, match: "id", maxRows: 10_000 })
        .in(ActionPlace.ListHeader),
      a.create().then(ResourcePage.View),
    ];
  }
}

class ProductResource extends Resource<Product>({
  area: ApiArea.Admin,
  operations: { list: true, create: true, update: true },
}) {
  override form(f: Form<CreateInput<Product>>) {
    return f.fields((x) => [
      x.steps("product", [
        x.step("basics", [x.grid(2, [x.from("title").span(2), x.from("slug")])]),
        x.step("media", [x.upload("title", { action: AttachImageAction })]),
        x.step("variants", [x.repeater("variants", (v) => [v.from("sku"), v.from("barcode")])]),
      ]),
    ]);
  }
}

describe("Resource", () => {
  it("records its checked options under the resource kind", () => {
    const record = kindOf(OrderResource);
    expect(record?.kind).toBe("resource");
    expect(record?.options).toEqual({
      area: ApiArea.Admin,
      navigation: { group: GROUP, icon: TestIcons.Receipt, order: 20, badge: "awaiting_payment" },
      operations: { list: ListOrdersQuery, get: GetOrderQuery },
    });
    expect(new OrderResource()).toBeInstanceOf(ResourceBase);
  });

  it("refuses an unknown area, a missing operations map and an unknown operation", () => {
    const resource = Resource as unknown as (options: object) => unknown;
    expect(() => resource({ area: "nowhere", operations: {} })).toThrow(TypeError);
    expect(() => resource({ area: ApiArea.Admin })).toThrow(TypeError);
    expect(() => resource({ area: ApiArea.Admin, operations: { publish: true } })).toThrow(
      /publish/,
    );
    expect(() => resource({ area: ApiArea.Admin, operations: { list: "yes" } })).toThrow(TypeError);
  });

  it("records nothing for a member the class does not override", () => {
    class Bare extends Resource<Order>({
      area: ApiArea.Admin,
      operations: { list: true },
    }) {}
    expect(describeResource(Bare)).toEqual({
      options: { area: ApiArea.Admin, operations: { list: true } },
    });
  });

  it("records a template-shaped resource", () => {
    const tree = describeResource(OrderResource);
    expect(tree.table).toEqual({
      columns: [
        { kind: "value", key: "id", copyable: true },
        { kind: "money", key: "totals.totalMinor", currency: "totals.currency", sortable: true },
        { kind: "count", key: "lines" },
        { kind: "value", key: "createdAt", sortable: true, hidden: true },
      ],
      filters: [
        { kind: "value", key: "status", default: ["paid"], pinned: true },
        { kind: "trashed" },
      ],
      defaultSort: { key: "createdAt", direction: "desc" },
      count: "estimated",
    });
    expect(tree.views).toEqual([
      {
        name: "paid_today",
        filter: { status: ["paid"], createdAt: "today" },
        sort: { key: "createdAt", direction: "desc" },
      },
    ]);
    expect(tree.infolist?.entries[1]).toEqual({
      kind: "section",
      name: "totals",
      entries: [
        { kind: "money", key: "totals.totalMinor", currency: "totals.currency" },
        { kind: "list", key: "lines", columns: ["sku"] },
      ],
      aside: true,
    });
    expect(tree.relations?.[0]).toMatchObject({
      kind: "table",
      query: ListOrderLinesQuery,
      columns: [
        { kind: "value", key: "sku" },
        { kind: "money", key: "unitPriceMinor", currency: "record.totals.currency" },
      ],
    });
    expect(tree.actions).toEqual([
      { kind: "run", action: CancelOrderAction, bulk: true },
      { kind: "run", action: AttachImageAction, places: ["view", "edit"] },
      { kind: "export", formats: ["csv", "xlsx"] },
      { kind: "import", mode: "upsert", match: "id", maxRows: 10_000, places: ["list_header"] },
      { kind: "create", after: "view" },
    ]);
  });

  it("records a form of steps, a grid, an upload and a repeater", () => {
    expect(describeResource(ProductResource).form).toEqual({
      fields: [
        {
          kind: "steps",
          name: "product",
          steps: [
            {
              name: "basics",
              fields: [
                {
                  kind: "grid",
                  columns: 2,
                  fields: [
                    { kind: "value", key: "title", span: 2 },
                    { kind: "value", key: "slug" },
                  ],
                },
              ],
            },
            {
              name: "media",
              fields: [{ kind: "upload", key: "title", action: AttachImageAction }],
            },
            {
              name: "variants",
              fields: [
                {
                  kind: "repeater",
                  key: "variants",
                  fields: [
                    { kind: "value", key: "sku" },
                    { kind: "value", key: "barcode" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("types the partner: keys are paths of the row and the type argument is required", () => {
    expectTypeOf<Parameters<OrderResource["table"]>[0]>().toEqualTypeOf<Table<OrderView>>();
    // @ts-expect-error -- a called form without its model fails with the hint
    Resource({ area: ApiArea.Admin, operations: { list: true } });
  });
});
