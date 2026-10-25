/**
 * Stackra file contract:
 * Purpose: unit tests of `emitSchemas`: one `X$` per enum and shape in dependency order, the codecs and rules of each
 *          field type, `.exactOptional()`, `.nullable()` and constant defaults, the `X$Check` assertions, the
 *          `{ input, output }` of each action and query, the config alias, a member base `.extend`ed, a package base
 *          reused through `Base<Name>$`, a later reference made lazy, a sibling module imported, the
 *          `registerSchemas` call of gap G1, and the `registerChanges` call beside it.
 * Boundary: test only; asserts on the generated source text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); ADR 0305 (rules 1 and 14); registry v3.1 G1.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitSchemas } from "#core/functions/emit-schemas.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

describe("emitSchemas", () => {
  const orders = emitSchemas(COMMERCE_IR, "orders");

  it("emits enums and shapes with their codecs and rules", () => {
    expect(orders).toContain('export const OrderStatus$ = z.enum(["pending","paid","cancelled"]);');
    expect(orders).toContain('  orderId: publicId("ord"),');
    expect(orders).toContain("  status: OrderStatus$,");
    expect(orders).toContain("  cursor: z.string().exactOptional(),");
    expect(orders).toContain("  limit: z.number().int().min(1).max(100).default(20),");
    expect(orders).toContain("  total: money(),");
    expect(orders).toContain("  placedAt: isoDateTime().nullable(),");
    expect(orders).toContain(
      "  note: z.string().trim().max(500).regex(/^[^<>]*$/).exactOptional(),",
    );
    expect(orders).toContain("  items: z.array(OrderView$),");
  });

  it("declares a shape after the shapes it refers to", () => {
    expect(orders.indexOf("export const OrderView$")).toBeLessThan(
      orders.indexOf("export const ListOrdersOutput$"),
    );
  });

  it("emits the checks, the handle schemas and the registry call", () => {
    expect(orders).toContain(
      "export type CancelOrderInput$Check = Assert<Same<z.output<typeof CancelOrderInput$>, Fields<CancelOrderInput>>>;",
    );
    expect(orders).toContain(
      "export const CancelOrderAction$ = { input: CancelOrderInput$, output: CancelOrderOutput$ } as const;",
    );
    expect(orders).toContain(
      "export const ListOrdersQuery$ = { input: ListOrdersInput$, output: ListOrdersOutput$ } as const;",
    );
    expect(orders).toContain("  [OrderView, OrderView$],");
    expect(orders).toContain(
      'import { CancelOrderInput } from "#modules/orders/schemas/cancel-order-input.schema";',
    );
    expect(orders).toContain('import { money } from "@stackra/money";');
    expect(orders).toMatch(
      /import \{ type Assert, type Fields, isoDateTime, publicId, registerSchemas, type Same \} from "@stackra\/validation";/,
    );
  });

  it("aliases a config to its schema", () => {
    const commerce = emitSchemas(COMMERCE_IR, "commerce");
    expect(commerce).toContain('  gateway: z.enum(["stripe"]).default("stripe"),');
    expect(commerce).toContain("export const CommerceConfig$ = CommerceOptions$;");
  });

  it("extends member bases, reuses package bases and refers across modules", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      shapes: [
        {
          name: "DraftOrder",
          kind: "schema",
          module: "orders",
          file: "src/modules/orders/schemas/draft-order.schema.ts",
          importPath: "#modules/orders/schemas/draft-order.schema",
          base: { kind: "member", name: "OrderView", module: "orders" },
          fields: [
            {
              name: "lines",
              optional: false,
              nullable: false,
              type: { kind: "schema", name: "OrderLineView", module: "orders" },
              rules: [],
            },
          ],
          relations: [],
        },
        {
          name: "OrderLineView",
          kind: "schema",
          module: "orders",
          file: "src/modules/orders/schemas/order-line-view.schema.ts",
          importPath: "#modules/orders/schemas/order-line-view.schema",
          fields: [
            {
              name: "draft",
              optional: true,
              nullable: false,
              type: { kind: "schema", name: "DraftOrder", module: "orders" },
              rules: [],
            },
          ],
          relations: [],
        },
        {
          name: "OrderView",
          kind: "schema",
          module: "orders",
          file: "src/modules/orders/schemas/order-view.schema.ts",
          importPath: "#modules/orders/schemas/order-view.schema",
          fields: [
            {
              name: "customer",
              optional: false,
              nullable: false,
              type: { kind: "schema", name: "CustomerView", module: "customers" },
              rules: [],
            },
          ],
          relations: [],
        },
        {
          name: "LoyaltyKitConfig",
          kind: "config",
          module: "orders",
          file: "src/config/loyalty-kit.config.ts",
          importPath: "#config/loyalty-kit.config",
          base: { kind: "package", name: "LoyaltyKitConfig", from: "@acme/loyalty-kit" },
          fields: [
            {
              name: "maxRedeemPercent",
              optional: false,
              nullable: false,
              type: { kind: "number" },
              rules: [],
              default: { value: 30, code: "30", imports: [] },
            },
          ],
          relations: [],
        },
      ],
      enums: [],
      classes: [],
    };
    const content = emitSchemas(ir, "orders");
    expect(content).toContain("export const DraftOrder$ = OrderView$.extend({");
    expect(content).toMatch(/lines: OrderLineView\$|lines: z\.lazy\(\(\) => OrderLineView\$\)/);
    expect(content).toContain("z.lazy(() => DraftOrder$)");
    expect(content).toContain('import { CustomerView$ } from "./customers";');
    expect(content).toContain(
      'import { LoyaltyKitConfig$ as BaseLoyaltyKitConfig$ } from "@acme/loyalty-kit";',
    );
    expect(content).toContain(
      "  maxRedeemPercent: BaseLoyaltyKitConfig$.shape.maxRedeemPercent.default(30),",
    );
  });

  it("links each change to its subject beside the schemas", () => {
    const billing = emitSchemas(BILLING_IR, "billing");
    expect(billing).toContain('import { registerChanges } from "@stackra/versioning";');
    expect(billing).toContain(
      'import { InvoiceIssued } from "#modules/billing/events/invoice-issued.event";',
    );
    expect(billing).toContain(
      'import { InvoiceIssuedChange } from "#modules/billing/events/invoice-issued.change";',
    );
    expect(billing).toContain("registerChanges([\n  [InvoiceIssued, InvoiceIssuedChange],\n]);");
    expect(orders).not.toContain("registerChanges");
  });
});
