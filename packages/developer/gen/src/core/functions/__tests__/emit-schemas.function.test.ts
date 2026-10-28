/**
 * Stackra file contract:
 * Purpose: unit tests of `emitSchemas`: one `X$` per enum and shape in dependency order, the codecs and rules of each
 *          field type, `.exactOptional()`, `.nullable()` and constant defaults, the `X$Check` assertions, the
 *          `{ input, output }` of each action and query, the config alias (none for one the member ships), a member base `.extend`ed, a package base
 *          reused through `Base<Name>$`, a later reference made lazy, a sibling module imported, the
 *          `registerSchemas` call of gap G1, the `registerChanges` call beside it, and the translated and upload
 *          kinds (STA-1218), and a package's shipped `X$` imported as `ShippedX$` (STA-1290), and a hatch's imports
 *          with nullable applied once (STA-1293), and a consumed shape's `schema` extended (STA-1363).
 * Boundary: test only; asserts on the generated source text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); ADR 0305 (rules 1 and 14); registry v3.1 G1;
 *                     ADR 0162; ADR 0222; STA-1365 (`I18nKey`).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitSchemas } from "#core/functions/emit-schemas.function";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
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

  it("declares no config alias the member ships itself, so a hatch importing it reads the shipped one", () => {
    const shipped = emitSchemas(
      {
        ...COMMERCE_IR,
        files: [
          ...COMMERCE_IR.files,
          {
            file: "src/config/commerce-config-schema.constant.ts",
            importPath: "#config/commerce-config-schema.constant",
            folder: "config",
            names: [{ name: "CommerceConfig$", typeOnly: false }],
          },
        ],
      },
      "commerce",
    );
    expect(shipped).not.toContain("export const CommerceConfig$");
    expect(shipped).toContain("export const CommerceOptions$ = z.object({");
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
    expect(billing).toContain("], { replace: false });");
    expect(orders).not.toContain("registerChanges");
  });

  it("decodes a translated field through Translated.of and an upload through Upload.schema", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      shapes: [
        {
          name: "Listing",
          kind: "schema",
          module: "orders",
          file: "src/modules/orders/schemas/listing.schema.ts",
          importPath: "#modules/orders/schemas/listing.schema",
          fields: [
            {
              name: "title",
              optional: false,
              nullable: false,
              type: { kind: "translated", form: "value" },
              rules: [{ name: "Str", options: { max: 200 } }],
            },
            {
              name: "description",
              optional: false,
              nullable: true,
              type: { kind: "translated", form: "value" },
              rules: [],
            },
            {
              name: "label",
              optional: false,
              nullable: false,
              type: { kind: "translated", form: "strings" },
              rules: [],
            },
            {
              name: "photo",
              optional: false,
              nullable: false,
              type: { kind: "upload", bucket: "PhotosBucket" },
              rules: [],
            },
          ],
          relations: [],
        },
      ],
      enums: [],
      classes: [],
    };
    const content = emitSchemas(ir, "orders");
    expect(content).toContain('import { Translated } from "@stackra/model";');
    expect(content).toContain('import { Upload } from "@stackra/media";');
    expect(content).toContain(
      "  title: z.record(z.string(), z.string().max(200)).transform((values) => Translated.of(values)),",
    );
    expect(content).toContain(
      "  description: z.record(z.string(), z.string()).transform((values) => Translated.of(values)).nullable(),",
    );
    expect(content).toContain(
      "  label: z.record(z.string(), z.string()).transform((values) => ({ values })),",
    );
    expect(content).toContain("  photo: Upload.schema,");
  });

  it("checks a bare public id's format with any prefix and a prefix union as a union", () => {
    const refs: ShapeIR = {
      name: "Refs",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/refs.schema.ts",
      importPath: "#modules/orders/schemas/refs.schema",
      fields: [
        {
          name: "principalId",
          optional: false,
          nullable: false,
          type: { kind: "public_id", prefix: "" },
          rules: [],
        },
        {
          name: "listId",
          optional: false,
          nullable: false,
          type: { kind: "public_id", prefix: "", prefixes: ["crl", "prl"] },
          rules: [],
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [refs], enums: [], classes: [] },
      "orders",
    );
    expect(content).toContain(
      "  principalId: z.string().regex(/^[a-z]{2,6}_[0-9a-hjkmnp-tv-z]{26}$/i).transform((value) => value as PublicId),",
    );
    expect(content).toContain('  listId: z.union([publicId("crl"), publicId("prl")]),');
    // `importLines` writes `import type { … }` when every name from a module is a type.
    expect(content).toMatch(
      /import (?:type )?\{[^}]*\bPublicId\b[^}]*\} from "@stackra\/contracts";/,
    );
  });

  it("decodes an I18nKey as a string cast to the brand (STA-1365)", () => {
    const labelled: ShapeIR = {
      name: "Labelled",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/labelled.schema.ts",
      importPath: "#modules/orders/schemas/labelled.schema",
      fields: [
        {
          name: "label",
          optional: false,
          nullable: false,
          type: { kind: "brand", brand: "i18n_key" },
          rules: [],
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [labelled], enums: [], classes: [] },
      "orders",
    );
    expect(content).toContain("  label: z.string().transform((value) => value as I18nKey),");
    expect(content).toMatch(/import type \{ I18nKey \} from "@stackra\/i18n";/);
  });

  it("imports a package's shipped schema under an alias instead of compiling it (STA-1290)", () => {
    const site: ShapeIR = {
      name: "Site",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/site.schema.ts",
      importPath: "#modules/orders/schemas/site.schema",
      fields: [
        {
          name: "address",
          optional: false,
          nullable: false,
          type: { kind: "shipped", name: "Address", from: "@stackra/validation" },
          rules: [],
        },
        {
          name: "audience",
          optional: false,
          nullable: true,
          type: { kind: "shipped", name: "Audience", from: "@stackra/iam/contracts" },
          rules: [],
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [site], enums: [], classes: [] },
      "orders",
    );
    expect(content).toContain("  address: ShippedAddress$,");
    expect(content).toContain("  audience: ShippedAudience$.nullable(),");
    expect(content).toMatch(
      /import \{[^}]*Address\$ as ShippedAddress\$[^}]*\} from "@stackra\/validation";/,
    );
    expect(content).toContain(
      'import { Audience$ as ShippedAudience$ } from "@stackra/iam/contracts";',
    );
  });

  it("extends a consumed shape's schema static, picked first for a PickType (STA-1363)", () => {
    const head = { kind: "schema", module: "orders", relations: [] };
    const quick: ShapeIR = {
      ...head,
      name: "QuickOrderForm",
      file: "src/modules/orders/schemas/quick-order-form.schema.ts",
      importPath: "#modules/orders/schemas/quick-order-form.schema",
      base: {
        kind: "remote",
        name: "CreateOrderInput",
        from: "#stackra/clients/commerce",
        derive: { helper: "PickType", keys: ["lines"] },
      },
      fields: [
        { name: "note", optional: false, nullable: false, type: { kind: "string" }, rules: [] },
      ],
    };
    const line: ShapeIR = {
      ...head,
      name: "CreateOrderForm",
      file: "src/modules/orders/schemas/create-order-form.schema.ts",
      importPath: "#modules/orders/schemas/create-order-form.schema",
      base: { kind: "remote", name: "RequestedLine", from: "#stackra/clients/commerce" },
      fields: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [quick, line], enums: [], classes: [] },
      "orders",
    );
    expect(content).toContain(
      'export const QuickOrderForm$ = RemoteCreateOrderInput.schema.pick({"lines":true}).extend({',
    );
    expect(content).toContain(
      "export const CreateOrderForm$ = RemoteRequestedLine.schema.extend({",
    );
    expect(content).toMatch(
      /import \{[^}]*CreateOrderInput as RemoteCreateOrderInput[^}]*\} from "#stackra\/clients\/commerce";/,
    );
  });

  it("imports what a hatch's source uses and applies nullable once (STA-1293)", () => {
    const variant: ShapeIR = {
      name: "VariantInput",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/variant-input.schema.ts",
      importPath: "#modules/orders/schemas/variant-input.schema",
      fields: [
        {
          name: "countryOfOrigin",
          optional: false,
          nullable: true,
          type: {
            kind: "hatch",
            source: "countryCode().nullable()",
            imports: [["countryCode", "@stackra/validation"]],
          },
          rules: [],
          default: { value: null, code: "null", imports: [] },
        },
        {
          name: "region",
          optional: false,
          nullable: true,
          type: { kind: "hatch", source: "z.string()" },
          rules: [],
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [variant], enums: [], classes: [] },
      "orders",
    );
    expect(content).toContain("  countryOfOrigin: countryCode().nullable().default(null),");
    expect(content).toContain("  region: z.string().nullable(),");
    expect(content).toMatch(/import \{[^}]*\bcountryCode\b[^}]*\} from "@stackra\/validation";/);
  });

  it("imports a hatch's type-only names as types", () => {
    const action: ShapeIR = {
      name: "HeroAction",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/hero-action.schema.ts",
      importPath: "#modules/orders/schemas/hero-action.schema",
      fields: [
        {
          name: "route",
          optional: false,
          nullable: false,
          type: {
            kind: "hatch",
            source: "z.custom<RouteKey>((key) => Object.hasOwn(Routes, key))",
            imports: [
              ["Routes", "#stackra/routes"],
              ["RouteKey", "#stackra/routes", true],
            ],
          },
          rules: [],
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [action], enums: [], classes: [] },
      "orders",
    );
    expect(content).toContain('import { type RouteKey, Routes } from "#stackra/routes";');
  });
});
