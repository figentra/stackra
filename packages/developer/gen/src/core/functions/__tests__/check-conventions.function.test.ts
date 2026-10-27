/**
 * Stackra file contract:
 * Purpose: unit tests of `checkConventions`: a conforming member passes; `kind_suffix_mismatch`, `kind_class_name`
 *          (a service may drop its suffix, names compare without case), `kind_unregistered_base`, `empty_module`,
 *          `sibling_not_exported`, `module_cycle`, `migration_numbering`, `event_name_shape` and
 *          `override_legacy_name` each refuse with a fix; and `generateMember` refuses on them in the full pass but
 *          still writes the manifest pass. A port-kind class in a `.driver.ts` file passes in a package below the
 *          container (`@stackra/contracts`) and is `kind_suffix_mismatch` anywhere else (STA-1365 item 4).
 * Boundary: test only; pure IR in, refusals out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (R1 to R3, decisions 13 and 24); ADR 0305 (rules 1 to 3
 *                     and 15 to 18); ADR 0263; ADR 0141; STA-1306; STA-1365.
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { checkConventions } from "#core/functions/check-conventions.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The fixture class named `name`. */
function fixture(name: string): DeclaredClass {
  const found = COMMERCE_IR.classes.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`no fixture class ${name}`);
  return found;
}

/** A plain class of `kind` in `file`, module `module`. */
function declared(
  name: string,
  kind: string,
  module: string,
  file: string,
  extra: Partial<DeclaredClass> = {},
): DeclaredClass {
  return {
    ...fixture("OrderService"),
    name,
    kind,
    module,
    file,
    importPath: `#${file.slice("src/".length, -".ts".length)}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    ...extra,
  };
}

/** The codes and subjects `checkConventions` refuses for `ir`. */
function refused(ir: MemberIR): string[] {
  return checkConventions(ir, buildManifest(ir).manifest).map(
    (error) => `${error.code} ${error.subject}`,
  );
}

/** Commerce with `classes` added. */
const withClasses = (...classes: DeclaredClass[]): MemberIR => ({
  ...COMMERCE_IR,
  classes: [...COMMERCE_IR.classes, ...classes],
});

describe("checkConventions", () => {
  it("passes a member that follows every convention", () => {
    expect(refused(COMMERCE_IR)).toEqual([]);
  });

  it("refuses a kind class in another kind's file, and a class not named after its file", () => {
    expect(
      refused(
        withClasses(
          declared(
            "VoidOrderAction",
            "action",
            "orders",
            "src/modules/orders/queries/void-order.query.ts",
          ),
          declared(
            "RefundAction",
            "action",
            "orders",
            "src/modules/orders/actions/refund-order.action.ts",
          ),
          // A service may be named by its stem alone, and case does not count (`WhatsApp`).
          declared("Ledger", "service", "orders", "src/modules/orders/services/ledger.service.ts"),
          declared(
            "WhatsAppService",
            "service",
            "orders",
            "src/modules/orders/services/whatsapp.service.ts",
          ),
        ),
      ),
    ).toEqual(["kind_suffix_mismatch VoidOrderAction", "kind_class_name RefundAction"]);
  });

  it("lets a package below the container extend its port in a driver file, and nobody else (STA-1365)", () => {
    const driver = declared(
      "MemorySignerDriver",
      "port",
      "orders",
      "src/modules/orders/drivers/memory-signer.driver.ts",
    );
    expect(refused({ ...withClasses(driver), package: "@stackra/contracts" })).toEqual([]);
    expect(refused(withClasses(driver))).toEqual(["kind_suffix_mismatch MemorySignerDriver"]);
  });

  it("names the expected class in the kind_class_name fix", () => {
    const ir = withClasses(
      declared(
        "RefundAction",
        "action",
        "orders",
        "src/modules/orders/actions/refund-order.action.ts",
      ),
    );
    expect(checkConventions(ir, buildManifest(ir).manifest)[0]?.fix).toContain("RefundOrderAction");
  });

  it("lets a seeder lead with its module, and refuses another module's name", () => {
    expect(
      refused(
        withClasses(
          declared(
            "DemoSeeder",
            "seeder",
            "orders",
            "src/modules/orders/database/seeders/demo.seeder.ts",
          ),
          declared(
            "OrdersMinimalSeeder",
            "seeder",
            "orders",
            "src/modules/orders/database/seeders/minimal.seeder.ts",
          ),
          declared(
            "CatalogueTestSeeder",
            "seeder",
            "orders",
            "src/modules/orders/database/seeders/test.seeder.ts",
          ),
        ),
      ),
    ).toEqual(["kind_class_name CatalogueTestSeeder"]);
  });

  it("refuses a class in a kind file that extends no kind base", () => {
    expect(
      refused({
        ...COMMERCE_IR,
        files: [
          {
            file: "src/modules/orders/services/loose.service.ts",
            importPath: "#modules/orders/services/loose.service",
            folder: "modules",
            names: [{ name: "LooseService", typeOnly: false }],
            classes: ["LooseService"],
          },
          {
            file: "src/modules/orders/services/order.service.ts",
            importPath: "#modules/orders/services/order.service",
            folder: "modules",
            names: [{ name: "OrderService", typeOnly: false }],
            classes: ["OrderService"],
          },
        ],
      }),
    ).toEqual(["kind_unregistered_base LooseService"]);
  });

  it("refuses a module that states nothing, and keeps one that exports", () => {
    expect(
      refused(
        withClasses(
          declared("OrdersModule", "module", "orders", "src/modules/orders/orders.module.ts"),
        ),
      ),
    ).toEqual(["empty_module OrdersModule"]);
    expect(
      refused(
        withClasses(
          declared("OrdersModule", "module", "orders", "src/modules/orders/orders.module.ts", {
            options: {
              exports: [{ $class: "OrderService", from: "#modules/orders/services/order.service" }],
            },
          }),
        ),
      ),
    ).toEqual([]);
  });

  it("refuses an injected sibling service its module does not export, and a module cycle", () => {
    const invoices = declared(
      "InvoiceService",
      "service",
      "billing",
      "src/modules/billing/services/invoice.service.ts",
      {
        deps: [{ class: { name: "OrderService", from: "#modules/orders/services/order.service" } }],
      },
    );
    const orders = {
      ...fixture("OrderService"),
      deps: [
        { class: { name: "InvoiceService", from: "#modules/billing/services/invoice.service" } },
      ],
    };
    const ir: MemberIR = {
      ...COMMERCE_IR,
      modules: [...COMMERCE_IR.modules, "billing"],
      classes: [
        ...COMMERCE_IR.classes.filter((candidate) => candidate.name !== "OrderService"),
        orders,
        invoices,
      ],
    };
    expect(refused(ir)).toEqual([
      "sibling_not_exported OrderService.constructor",
      "sibling_not_exported InvoiceService.constructor",
      "module_cycle billing -> orders",
    ]);
  });

  it("refuses migrations not numbered NNNN- from 0001 without gaps", () => {
    const migration = (name: string) => ({
      file: `src/modules/orders/database/migrations/${name}`,
      importPath: `#modules/orders/database/migrations/${name.slice(0, -3)}`,
      folder: "modules",
      names: [],
    });
    const errors = checkConventions(
      {
        ...COMMERCE_IR,
        files: [
          migration("0001-create-orders.migration.ts"),
          migration("0003-add-totals.migration.ts"),
          migration("create-lines.migration.ts"),
        ],
      },
      buildManifest(COMMERCE_IR).manifest,
    );
    expect(errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "migration_numbering 0003-add-totals.migration.ts",
      "migration_numbering create-lines.migration.ts",
    ]);
    expect(errors[0]?.fix).toContain("0002-add-totals.migration.ts");
    expect(errors[1]?.fix).toContain("0003-create-lines.migration.ts");
  });

  it("refuses an integration event name that is not <aggregate>.<verb>", () => {
    const paid = fixture("OrderPaid");
    expect(
      refused(
        withClasses(
          { ...paid, name: "OrderShipped", options: { name: "shipped" } },
          { ...paid, name: "OrderPacked", options: {} },
          { ...paid, name: "OrderVoided", options: { name: "order.Voided" } },
        ),
      ).filter((code) => code.startsWith("event_name_shape")),
    ).toEqual([
      "event_name_shape OrderShipped",
      "event_name_shape OrderPacked",
      "event_name_shape OrderVoided",
    ]);
  });

  it("refuses an override that does not keep its base's plain name", () => {
    const base = { name: "OrderService", from: "@acme/orders", own: false };
    expect(
      refused(
        withClasses(
          declared(
            "OrderService",
            "service",
            "orders",
            "src/overrides/acme-orders/order.service.ts",
            { base },
          ),
          declared(
            "ShopOrderService",
            "service",
            "orders",
            "src/overrides/acme-orders/shop-order.service.ts",
            {
              base,
            },
          ),
        ),
      ).filter((code) => code.startsWith("override_legacy_name")),
    ).toEqual(["override_legacy_name ShopOrderService"]);
  });

  it("refuses in generateMember's full pass, never in the manifest pass", () => {
    const ir = withClasses(
      declared("Billing", "service", "orders", "src/modules/orders/services/invoice.service.ts"),
    );
    expect(generateMember(ir).errors.map((error) => error.code)).toContain("kind_class_name");
    expect(generateMember(ir, undefined, { pass: "manifests" }).errors).toEqual([]);
  });
});
