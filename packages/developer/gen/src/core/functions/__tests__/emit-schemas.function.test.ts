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
 *                     ADR 0162; ADR 0222; STA-1365 (`I18nKey`); STA-1826 (a settings section is prefaulted).
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

  it("augments a shape with initializers by its defaulted field names, and no other (STA-1694)", () => {
    expect(orders).toContain(
      'declare module "#modules/orders/schemas/list-orders-input.schema" {\n' +
        "  interface ListOrdersInput {\n" +
        '    readonly "~defaults"?: "limit";\n',
    );
    expect(orders).not.toContain("interface CancelOrderInput");
  });

  it("omits a driver-name field from the check and still augments it as defaulted (STA-1694, STA-1805)", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      shapes: [
        {
          name: "ChargeInput",
          kind: "schema",
          module: "orders",
          file: "src/modules/orders/schemas/charge-input.schema.ts",
          importPath: "#modules/orders/schemas/charge-input.schema",
          fields: [
            {
              name: "gateway",
              optional: false,
              nullable: false,
              type: { kind: "driver_name", port: "PaymentGateway", values: ["stripe"] },
              rules: [],
              default: { value: "stripe", code: '"stripe"', imports: [] },
            },
            {
              name: "retries",
              optional: false,
              nullable: false,
              type: { kind: "number", integer: true },
              rules: [],
              default: { value: 3, code: "3", imports: [] },
            },
          ],
          relations: [],
        } as ShapeIR,
      ],
    };
    const out = emitSchemas(ir, "orders");
    expect(out).toContain(
      'export type ChargeInput$Check = Assert<Same<Omit<z.output<typeof ChargeInput$>, "gateway">, Omit<Fields<ChargeInput>, "gateway">>>;',
    );
    expect(out).toContain('readonly "~defaults"?: "gateway" | "retries";');
  });

  it("aliases a config to its schema", () => {
    const commerce = emitSchemas(COMMERCE_IR, "commerce");
    expect(commerce).toContain('  gateway: z.enum(["stripe"]).default("stripe"),');
    expect(commerce).toContain("export const CommerceConfig$ = CommerceOptions$;");
    // a driver-name field is left out of the check on both sides: DriverName<P> widens without a `~key` brand (STA-1805)
    expect(commerce).toContain(
      'export type CommerceOptions$Check = Assert<Same<Omit<z.output<typeof CommerceOptions$>, "gateway">, Omit<Fields<CommerceOptions>, "gateway">>>;',
    );
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
    expect(content).toMatch(/lines: OrderLineView\$|get lines\(\) \{\n {4}return OrderLineView\$;/);
    // The cycle back to DraftOrder, declared later, is a getter (STA-1683).
    expect(content).toMatch(
      / {2}get draft\(\) \{\n {4}return DraftOrder\$\.exactOptional\(\);\n {2}\},/,
    );
    expect(content).not.toContain("z.lazy(");
    expect(content).toContain('import { CustomerView$ } from "./customers";');
    expect(content).toContain(
      'import { LoyaltyKitConfig$ as BaseLoyaltyKitConfig$ } from "@acme/loyalty-kit";',
    );
    expect(content).toContain(
      "  maxRedeemPercent: BaseLoyaltyKitConfig$.shape.maxRedeemPercent.default(30),",
    );
  });

  it("emits a self-recursive shape with a getter, so no hand registration is needed (STA-1683)", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      shapes: [
        {
          name: "ExploreGroupView",
          kind: "schema",
          module: "orders",
          file: "src/modules/orders/schemas/explore-group-view.schema.ts",
          importPath: "#modules/orders/schemas/explore-group-view.schema",
          fields: [
            {
              name: "count",
              optional: false,
              nullable: false,
              type: { kind: "number" },
              rules: [{ name: "Int", options: { min: 0 } }],
            },
            {
              name: "groups",
              optional: true,
              nullable: false,
              type: {
                kind: "array",
                element: { kind: "schema", name: "ExploreGroupView", module: "orders" },
              },
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
    expect(content).toContain("export const ExploreGroupView$ = z.object({");
    expect(content).toMatch(
      / {2}get groups\(\) \{\n {4}return z\.array\(ExploreGroupView\$\)[^\n]*;\n {2}\},/,
    );
    expect(content).not.toContain("z.lazy(");
    expect(content).toContain("  [ExploreGroupView, ExploreGroupView$],");
  });

  it("keeps an array default's codes literal, with a fresh array per parse (STA-1695)", () => {
    const settings: ShapeIR = {
      name: "SdksSettings",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/sdks-settings.schema.ts",
      importPath: "#modules/orders/schemas/sdks-settings.schema",
      fields: [
        {
          name: "languages",
          optional: false,
          nullable: false,
          type: {
            kind: "array",
            element: { kind: "enum", name: "SdkLanguage", values: ["typescript", "python", "php"] },
          },
          rules: [],
          default: {
            value: ["typescript", "python"],
            code: '["typescript","python"]',
            imports: [],
          },
        },
        {
          name: "limits",
          optional: false,
          nullable: false,
          type: { kind: "record", value: { kind: "number" } },
          rules: [],
          default: { value: {}, code: "{}", imports: [] },
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [settings], enums: [], classes: [] },
      "orders",
    );
    expect(content).toContain('.default(() => [...(["typescript","python"] as const)])');
    expect(content).toContain(".default(() => ({}))");
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

  it("lowercases a @Lowercase field and leaves a @Hidden field off the wire", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      shapes: [
        {
          name: "ApiKey",
          kind: "model",
          module: "orders",
          file: "src/modules/orders/models/api-key.model.ts",
          importPath: "#modules/orders/models/api-key.model",
          fields: [
            {
              name: "email",
              optional: false,
              nullable: false,
              type: { kind: "string" },
              rules: [
                { name: "Trim", options: {} },
                { name: "Lowercase", options: {} },
              ],
            },
            {
              name: "tokenHash",
              optional: false,
              nullable: false,
              type: { kind: "string" },
              rules: [],
              hidden: true,
            },
          ],
          relations: [],
        },
      ],
      enums: [],
      classes: [],
    };
    const content = emitSchemas(ir, "orders");
    expect(content).toContain("  email: z.string().trim().toLowerCase(),");
    expect(content).not.toContain("tokenHash: z.");
    expect(content).toContain(
      'export type ApiKey$Check = Assert<Same<z.output<typeof ApiKey$>, Omit<Fields<ApiKey>, "tokenHash">>>;',
    );
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

  it("aliases a hatch's import of an X$ this file declares itself, as an override's field reuses its base (STA-2215)", () => {
    const options: ShapeIR = {
      name: "GizmoOptions",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/gizmo-options.schema.ts",
      importPath: "#modules/orders/schemas/gizmo-options.schema",
      fields: [
        {
          name: "mode",
          optional: false,
          nullable: false,
          type: {
            kind: "hatch",
            source: "GizmoOptions$.shape.mode",
            imports: [["GizmoOptions$", "@acme/gizmos"]],
          },
          rules: [],
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [options], enums: [], classes: [] },
      "orders",
    );
    expect(content).toMatch(
      /import \{[^}]*GizmoOptions\$ as HatchGizmoOptions\$[^}]*\} from "@acme\/gizmos";/,
    );
    expect(content).toContain("  mode: HatchGizmoOptions$.shape.mode,");
    expect(content).toContain("export const GizmoOptions$ = z.object({");
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

  it("turns a hatch's trailing .optional() into .exactOptional() for a `?:` field (STA-2022)", () => {
    const campaign: ShapeIR = {
      name: "CampaignInput",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/campaign-input.schema.ts",
      importPath: "#modules/orders/schemas/campaign-input.schema",
      fields: [
        {
          name: "data",
          optional: true,
          nullable: false,
          type: { kind: "hatch", source: "z.record(z.string(), z.number())\n      .optional()" },
          rules: [],
        },
        {
          name: "note",
          optional: true,
          nullable: false,
          type: { kind: "hatch", source: "z.string()" },
          rules: [],
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [campaign], enums: [], classes: [] },
      "orders",
    );
    // `.optional().exactOptional()` admits `undefined`, which `?:` under exactOptionalPropertyTypes does not (TS2344).
    expect(content).not.toContain(".optional().exactOptional()");
    expect(content).toContain("  data: z.record(z.string(), z.number()).exactOptional(),");
    expect(content).toContain("  note: z.string().exactOptional(),");
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

  it("gives a settings section a prefault, so a missing section parses its own defaults (STA-1826)", () => {
    const section: ShapeIR = {
      name: "RoutingSettings",
      kind: "schema",
      module: "gateway",
      file: "src/modules/gateway/schemas/routing-settings.schema.ts",
      importPath: "#modules/gateway/schemas/routing-settings.schema",
      fields: [
        {
          name: "strictInRegion",
          optional: false,
          nullable: false,
          type: { kind: "boolean" },
          rules: [],
          default: { value: false, code: "false", imports: [] },
        },
      ],
      relations: [],
    };
    const settings: ShapeIR = {
      name: "GatewaySettings",
      kind: "settings",
      module: "gateway",
      file: "src/modules/gateway/gateway.settings.ts",
      importPath: "#modules/gateway/gateway.settings",
      fields: [
        {
          name: "escalationHours",
          optional: false,
          nullable: false,
          type: { kind: "number" },
          rules: [],
          default: { value: 24, code: "24", imports: [] },
        },
        {
          name: "routing",
          optional: false,
          nullable: false,
          type: { kind: "schema", name: "RoutingSettings", module: "gateway" },
          rules: [],
        },
      ],
      relations: [],
    };
    const content = emitSchemas(
      { ...COMMERCE_IR, shapes: [section, settings], enums: [], classes: [] },
      "gateway",
    );
    expect(content).toContain("  strictInRegion: z.boolean().default(false),");
    expect(content).toContain("  routing: RoutingSettings$.prefault(() => ({})),");
    // a section of any other kind stays required: a missing one is an error
    const plain = emitSchemas(
      {
        ...COMMERCE_IR,
        shapes: [section, { ...settings, kind: "schema" }],
        enums: [],
        classes: [],
      },
      "gateway",
    );
    expect(plain).toContain("  routing: RoutingSettings$,");
  });
});
