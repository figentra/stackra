/**
 * Stackra file contract:
 * Purpose: unit tests of `reportsOf`, `emitReports` and the `reports` section of `buildManifest`: a report's manifest
 *          row (key, source model key, generated query key, dimensions, measures, default filter, permission key);
 *          the refusals `identity_missing`, `identity_collision`, `report_misplaced`, `report_vocabulary_invalid`,
 *          `report_dimension_unknown` and `report_measure_unknown` (followed through an own relation, not judged after
 *          a plain field or on a source that is no own model); and the `#stackra/reports` query file, absent without a
 *          report or without `@stackra/reports`.
 * Boundary: test only; runs on a hand-built orders service IR with an order and a customer model.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decisions 1 and 2; Enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitReports } from "#core/functions/emit-reports.function";
import { modelKey } from "#core/functions/model-key.function";
import { reportsOf } from "#core/functions/reports-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

const FILE = "src/modules/orders/reports/order-sales.report.ts";

/** A kind class of the orders module. */
function declaredClass(
  name: string,
  kind: string,
  file: string,
  more: Partial<DeclaredClass> = {},
): DeclaredClass {
  return {
    name,
    kind,
    module: "orders",
    file,
    importPath: `#modules/orders/${file.split("/orders/")[1]?.replace(/\.ts$/, "")}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...more,
  };
}

/** A string field. */
function field(name: string): FieldIR {
  return { name, optional: false, nullable: false, type: { kind: "string" }, rules: [] };
}

/** A model shape with its fields and relations. */
function model(
  name: string,
  fields: readonly string[],
  relations: ShapeIR["entity"] = undefined,
): ShapeIR {
  return {
    name,
    kind: "model",
    module: "orders",
    file: `src/modules/orders/models/${name.toLowerCase()}.model.ts`,
    importPath: `#modules/orders/models/${name.toLowerCase()}.model`,
    fields: fields.map(field),
    relations: [],
    ...(relations !== undefined ? { entity: relations } : {}),
  };
}

/** The order sales report's options. */
const OPTIONS = {
  key: "order_sales",
  dimensions: {
    placedAt: { path: "placedAt", grains: ["day", "month"] },
    country: { path: "customer.country" },
  },
  measures: {
    orders: { kind: "count", metric: "count" },
    revenue: { kind: "sum", field: "total", metric: "money" },
    perOrder: { kind: "formula", formula: "revenue / orders", metric: "number" },
  },
  defaultFilter: { status: "paid" },
  permission: {
    $class: "OrderPermissions",
    from: "#modules/orders/permissions/order.permissions",
    member: "report",
  },
};

/** The report class, with options and file overridable. */
function report(
  options: Record<string, unknown> = OPTIONS,
  file = FILE,
  name = "OrderSalesReport",
): DeclaredClass {
  return declaredClass(name, "report", file, {
    options,
    partner: { name: "Order", kind: "model", from: "#modules/orders/models/order.model" },
  });
}

/** The orders service with the given reports. */
function service(
  reports: readonly DeclaredClass[] = [report()],
  more: Partial<MemberIR> = {},
): MemberIR {
  return {
    member: "orders",
    package: "@figentra/service-orders",
    version: "1.0.0",
    layout: "service",
    modules: ["orders"],
    classes: [
      declaredClass("Order", "model", "src/modules/orders/models/order.model.ts"),
      declaredClass("Customer", "model", "src/modules/orders/models/customer.model.ts"),
      declaredClass(
        "OrderPermissions",
        "permissions",
        "src/modules/orders/permissions/order.permissions.ts",
        {
          statics: { read: "Permission.L0", report: "Permission.L1" },
        },
      ),
      ...reports,
    ],
    shapes: [
      model("Order", ["placedAt", "status", "total"], {
        optional: ["createdAt"],
        computed: [],
        relations: [
          {
            name: "customer",
            kind: "m:1",
            target: { name: "Customer", from: "#modules/orders/models/customer.model" },
            targetModule: "orders",
            nullable: false,
            ref: false,
            options: {},
          },
        ],
      }),
      model("Customer", ["country"]),
    ],
    enums: [],
    files: [],
    dependencies: [],
    errors: [],
    ...more,
  };
}

/** The refusal codes of the orders service with `reports`. */
function codes(reports: readonly DeclaredClass[]): string[] {
  return reportsOf(service(reports)).errors.map((error) => error.code);
}

describe("reportsOf", () => {
  it("lists a report with its source, query key, dimensions, measures and permission", () => {
    expect(reportsOf(service())).toEqual({
      reports: [
        {
          key: "orders.order_sales",
          class: "OrderSalesReport",
          module: "orders",
          file: FILE,
          source: modelKey("orders", "Order"),
          query: "orders.report.order_sales@1",
          dimensions: {
            placedAt: { path: "placedAt", grains: ["day", "month"] },
            country: { path: "customer.country" },
          },
          measures: {
            orders: { kind: "count", metric: "count" },
            revenue: { kind: "sum", metric: "money", field: "total" },
            perOrder: { kind: "formula", metric: "number", formula: "revenue / orders" },
          },
          defaultFilter: { status: "paid" },
          permission: "orders.order.report",
        },
      ],
      errors: [],
    });
  });

  it("puts the section in the manifest only when there is a report", () => {
    expect(buildManifest(service()).manifest["reports"]).toHaveLength(1);
    expect("reports" in buildManifest(service([])).manifest).toBe(false);
  });

  it("refuses a report without a key, a second one with its key, and one outside reports/", () => {
    expect(codes([report({ ...OPTIONS, key: undefined })])).toEqual(["identity_missing"]);
    expect(
      codes([
        report(),
        report(OPTIONS, "src/modules/orders/reports/order-totals.report.ts", "OrderTotalsReport"),
      ]),
    ).toEqual(["identity_collision"]);
    expect(codes([report(OPTIONS, "src/modules/orders/order-sales.report.ts")])).toEqual([
      "report_misplaced",
    ]);
  });

  it("refuses a grain, measure kind or metric outside the closed set", () => {
    const { errors } = reportsOf(
      service([
        report({
          ...OPTIONS,
          dimensions: { placedAt: { path: "placedAt", grains: ["minute"] } },
          measures: { orders: { kind: "median", field: "total", metric: "count" } },
        }),
      ]),
    );
    expect(errors.map((error) => error.code)).toEqual([
      "report_vocabulary_invalid",
      "report_vocabulary_invalid",
    ]);
  });

  it("refuses paths the source model does not declare, through its own relations", () => {
    const { errors } = reportsOf(
      service([
        report({
          ...OPTIONS,
          dimensions: {
            region: { path: "region" },
            city: { path: "customer.city" },
            created: { path: "createdAt" },
            minor: { path: "total.minor" },
          },
          measures: { refunds: { kind: "sum", field: "refunded", metric: "number" } },
        }),
      ]),
    );
    expect(
      errors.map((error) => [error.code, error.message.match(/"(\w+)" is no field/)?.[1]]),
    ).toEqual([
      ["report_dimension_unknown", "region"],
      ["report_dimension_unknown", "city"],
      ["report_measure_unknown", "refunded"],
    ]);
  });

  it("does not judge paths on a source that is no own model", () => {
    const projected = declaredClass(
      "OrderBookReport",
      "report",
      "src/modules/orders/reports/order-book.report.ts",
      {
        options: {
          ...OPTIONS,
          key: "order_book",
          dimensions: { anything: { path: "whatever.deep" } },
        },
        partner: { name: "OrderBookRow", from: "#modules/orders/models/order-book.projection" },
      },
    );
    const { reports, errors } = reportsOf(service([projected]));
    expect(errors).toEqual([]);
    expect(reports[0]?.["source"]).toBe("OrderBookRow");
  });
});

describe("emitReports", () => {
  it("writes one query per report that runs it through ReportRunner", () => {
    const file = emitReports(
      service([report()], { packages: ["@stackra/actions", "@stackra/reports"] }),
    );
    expect(file).toContain('import { Query } from "@stackra/actions";');
    expect(file).toContain(
      'import { ReportRunner, type ReportRequest, type ReportResult } from "@stackra/reports";',
    );
    expect(file).toContain(
      'import { OrderSalesReport } from "#modules/orders/reports/order-sales.report";',
    );
    expect(file).toContain(
      'import { OrderPermissions } from "#modules/orders/permissions/order.permissions";',
    );
    expect(file).toContain(
      'export class OrderSalesReportQuery extends Query({ key: "report.order_sales", permission: OrderPermissions.report }) {',
    );
    expect(file).toContain("    return this.runner.run(OrderSalesReport, input);");
  });

  it("writes nothing without a report or without @stackra/reports", () => {
    expect(emitReports(service([]))).toBeUndefined();
    expect(emitReports(service([report()], { packages: ["@stackra/actions"] }))).toBeUndefined();
  });
});
