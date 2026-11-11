/**
 * Stackra file contract:
 * Purpose: unit tests of `generateMember`: the full file set of a service (manifest, openapi, one schemas file and
 *          one entity file per module, wiring, member module, registrations, boot, the inbound webhook route, the
 *          HTTP adapter of a service that runs @stackra/app,
 *          prefixes, server entry, tool configs), of an app (route tables and blocks per runtime, client entries) and
 *          of a package (no openapi, entry barrels), no file at all when discovery, the manifest or the identity lock
 *          refuses, and `@Renamed` accepted by the lock. A generated search query gets its manifest entry (with the
 *          package input and output schemas), endpoint, tool and wiring binding like an authored query, and no
 *          empty `X$` in the schemas file (STA-1459). Every full run ends with the member graph (ADR 0452). A warning
 *          never stops writing and comes back in `warnings`, beside a refusal too (STA-340).
 * Boundary: test only; runs on the IR fixtures.
 * The root `vitest.config.ts` shim is listed with the tool configs (STA-1296).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10, 22 and 26); ADR 0295 (decision 7);
 *                     STA-1365 (no wiring and no container import for a member off `@stackra/container`).
 */
import { describe, expect, it } from "@stackra/testing";

import { generateMember } from "#core/functions/generate-member.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** LOYALTY_KIT_IR (a package) with one model per listed module. */
const packageWithModels = (...modules: string[]) => ({
  ...LOYALTY_KIT_IR,
  shapes: [
    ...LOYALTY_KIT_IR.shapes,
    ...modules.map((module, index) => ({
      name: `LoyaltyAccount${index}`,
      kind: "model",
      module,
      file: `src/node/models/loyalty-account-${index}.model.ts`,
      importPath: `#node/models/loyalty-account-${index}.model`,
      fields: [],
      relations: [],
      entity: { optional: [], relations: [], computed: [] },
    })),
  ],
});

describe("generateMember", () => {
  it("warns on a staged check in 0.19, and refuses it when run strict (STA-2096, STA-340)", () => {
    const permissions = COMMERCE_IR.classes.find((item) => item.name === "OrderPermissions");
    if (permissions === undefined) throw new Error("the fixture has no OrderPermissions");
    const ir = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes.filter((item) => item.name !== permissions.name),
        { ...permissions, statics: { ...permissions.statics, cancel: "Permission.L1" } },
      ],
    };
    const staged = generateMember(ir);
    expect(staged.errors.map((error) => error.code)).not.toContain("action_risk_below_write");
    expect(staged.warnings?.map((warning) => warning.code)).toContain("action_risk_below_write");
    expect(staged.files.length).toBeGreaterThan(0);
    const strict = generateMember(ir, undefined, { strict: true });
    expect(strict.errors.map((error) => error.code)).toContain("action_risk_below_write");
  });

  it("writes every file of a service", () => {
    const { files, errors, manifest } = generateMember(COMMERCE_IR);
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([
      "stackra.manifest.json",
      "openapi.json",
      ".stackra/gen/schemas/commerce.ts",
      ".stackra/gen/schemas/orders.ts",
      ".stackra/gen/wiring.ts",
      ".stackra/gen/module.ts",
      ".stackra/gen/registrations.ts",
      ".stackra/gen/boot.ts",
      ".stackra/gen/encore-sqldb.d.ts",
      ".stackra/gen/prefixes.ts",
      "stackra-encore/commerce/encore.service.ts",
      "stackra-encore/commerce/api.ts",
      "stackra-encore/commerce/database.ts",
      "stackra-encore/commerce/events.ts",
      "stackra-encore/commerce/broker-message.ts",
      ".stackra/entry/server.ts",
      ".stackra/tsdown.config.ts",
      ".stackra/vitest.config.ts",
      ".stackra/vitest.setup.ts",
      "vitest.config.ts",
      ".stackra/graph.json",
    ]);
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
    expect(JSON.parse(files[0]?.content ?? "{}")).toEqual(JSON.parse(JSON.stringify(manifest)));
    expect(files[0]?.content.endsWith("}\n")).toBe(true);
  });

  it("writes the entity files, registrations, boot, webhook route, CronJobs, queue topics and event topics of a service", () => {
    const { files, errors } = generateMember(BILLING_IR);
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([
      "stackra.manifest.json",
      "openapi.json",
      ".stackra/gen/schemas/billing.ts",
      ".stackra/gen/schemas/crm.ts",
      ".stackra/gen/entities/billing.ts",
      ".stackra/gen/entities/crm.ts",
      ".stackra/gen/wiring.ts",
      ".stackra/gen/module.ts",
      ".stackra/gen/registrations.ts",
      ".stackra/gen/boot.ts",
      ".stackra/gen/encore-sqldb.d.ts",
      ".stackra/gen/webhooks.ts",
      ".stackra/gen/prefixes.ts",
      ".stackra/gen/queues.ts",
      ".stackra/gen/search.ts",
      "stackra-encore/billing/encore.service.ts",
      "stackra-encore/billing/api.ts",
      "stackra-encore/billing/cron.ts",
      "stackra-encore/billing/database.ts",
      "stackra-encore/billing/queues.ts",
      "stackra-encore/billing/http.ts",
      "stackra-encore/billing/events.ts",
      "stackra-encore/billing/broker-message.ts",
      ".stackra/entry/server.ts",
      ".stackra/tsdown.config.ts",
      ".stackra/vitest.config.ts",
      ".stackra/vitest.setup.ts",
      "vitest.config.ts",
      ".stackra/graph.json",
    ]);
    const server = files.find((file) => file.path === ".stackra/entry/server.ts")?.content;
    expect(server).toContain('import "#stackra/registrations";');
    const setup = files.find((file) => file.path === ".stackra/vitest.setup.ts")?.content;
    expect(setup).toContain('import "#stackra/registrations";');
  });

  it("registers the generated search query like an authored one (STA-1459)", () => {
    const { files, errors, manifest } = generateMember(BILLING_IR);
    expect(errors).toEqual([]);
    const entry = manifest.actions?.find((action) => action["class"] === "SearchInvoiceQuery");
    expect(entry).toMatchObject({
      key: "billing.invoice.search@1",
      kind: "query",
      module: "billing",
      file: ".stackra/gen/search.ts",
      permission: "billing.invoice.read",
      actors: ["user", "agent", "service"],
      endpoint: { method: "GET", path: "/app/invoices/search", derived: true },
    });
    expect(entry?.["tool"]).toBeDefined();
    // Its input and output are the package shapes, described under the module, so the tool and clients see `q`.
    expect(entry?.["input"]).toEqual({ $ref: "#/schemas/billing.SearchQueryInput" });
    expect(entry?.["output"]).toEqual({ $ref: "#/schemas/billing.SearchQueryOutput" });
    expect((manifest.schemas as Record<string, unknown>)["billing.SearchQueryInput"]).toMatchObject(
      {
        required: ["q"],
        properties: { q: { type: "string" } },
      },
    );
    const schemas = files.find((file) => file.path === ".stackra/gen/schemas/billing.ts")?.content;
    expect(schemas).not.toContain("SearchInvoiceQuery$");
    const wiring = files.find((file) => file.path === ".stackra/gen/wiring.ts")?.content;
    expect(wiring).toContain('import { SearchInvoiceQuery } from "#stackra/search";');
    expect(wiring).toContain("provide: SearchInvoiceQuery");
  });

  it("writes the route tables, blocks and client entries of an app", () => {
    const { files, errors, manifest } = generateMember(WEB_APP_IR);
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([
      "stackra.manifest.json",
      ".stackra/gen/wiring.ts",
      ".stackra/gen/module.ts",
      ".stackra/gen/client-tools.ts",
      ".stackra/gen/routes/browser.ts",
      ".stackra/gen/routes/native.ts",
      ".stackra/gen/blocks/browser.ts",
      ".stackra/entry/browser.ts",
      ".stackra/entry/native.ts",
      ".stackra/graph.json",
    ]);
    expect(manifest["routes"]).toEqual([
      {
        key: "order_detail",
        class: "OrderDetailRoute",
        file: "src/routes/order-detail/order-detail.route.ts",
      },
      { key: "settings", class: "SettingsRoute", file: "src/routes/settings/settings.route.ts" },
    ]);
    const browser = files.find((file) => file.path === ".stackra/entry/browser.ts")?.content;
    expect(browser).toContain('import "#stackra/routes/browser";');
    expect(browser).toContain('import "#stackra/blocks/browser";');
    const native = files.find((file) => file.path === ".stackra/entry/native.ts")?.content;
    expect(native).toContain('import "#stackra/routes/native";');
    expect(native).not.toContain("#stackra/blocks/native");
  });

  it("writes entry barrels and no openapi for a package", () => {
    const paths = generateMember(LOYALTY_KIT_IR).files.map((file) => file.path);
    expect(paths).not.toContain("openapi.json");
    expect(paths).toContain(".stackra/entry/node.ts");
    expect(paths).not.toContain(".stackra/entry/server.ts");
    expect(paths).toContain(".stackra/tsdown.config.ts");
  });

  it("writes no wiring and no container import for a member off @stackra/container (STA-1365)", () => {
    // A member with no kind class, like @stackra/testing: before STA-1365 its wiring and setup imported the container.
    const { files, errors } = generateMember({
      ...LOYALTY_KIT_IR,
      package: "@stackra/testing",
      packages: ["@stackra/tsdown-config", "@stackra/vitest-config"],
      classes: [],
      shapes: [],
      enums: [],
    });
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).not.toContain(".stackra/gen/wiring.ts");
    expect(files.map((file) => file.path)).not.toContain(".stackra/gen/module.ts");
  });

  it("writes nothing when any check refuses", () => {
    const refused = {
      ...COMMERCE_IR,
      errors: [
        {
          code: "shape_number_kind",
          file: "x.ts",
          line: 1,
          column: 1,
          subject: "X.n",
          message: "m",
          fix: "f",
        },
      ],
    };
    expect(generateMember(refused)).toMatchObject({
      files: [],
      errors: [{ code: "shape_number_kind" }],
    });
  });

  it("writes every file beside a warning, returns it in `warnings`, and keeps it beside a refusal (STA-340)", () => {
    const finding = { file: "x.ts", line: 0, column: 0, subject: "X", message: "m", fix: "f" };
    const warning = { ...finding, code: "action_without_workflow", severity: "warning" as const };
    const refusal = { ...finding, code: "shape_number_kind" };
    const warned = generateMember({ ...COMMERCE_IR, errors: [warning] });
    expect(warned.errors).toEqual([]);
    expect(warned.warnings).toEqual([warning]);
    expect(warned.files.map((file) => file.path)).toEqual(
      generateMember(COMMERCE_IR).files.map((file) => file.path),
    );
    const refused = generateMember({ ...COMMERCE_IR, errors: [warning, refusal] });
    expect(refused).toMatchObject({ files: [], errors: [refusal], warnings: [warning] });
  });

  it("locks identities against the committed manifest unless renamed", () => {
    const committed = generateMember(COMMERCE_IR).manifest;
    const renamedKey = {
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.map((declared) =>
        declared.name === "CancelOrderAction"
          ? { ...declared, options: { ...declared.options, key: "order.void" } }
          : declared,
      ),
    };
    const permissions = renamedKey.classes.map((declared) =>
      declared.name === "OrderPermissions"
        ? { ...declared, statics: { ...declared.statics, void: "Permission.L2" } }
        : declared,
    );
    const changed = generateMember({ ...renamedKey, classes: permissions }, committed);
    expect(changed.errors.map((error) => error.code)).toEqual(["identity_changed"]);
    const accepted = generateMember(
      {
        ...renamedKey,
        classes: permissions.map((declared) =>
          declared.name === "CancelOrderAction"
            ? { ...declared, renamed: "order.cancel" }
            : declared,
        ),
      },
      committed,
    );
    expect(accepted.errors).toEqual([]);
  });

  it("writes a package's entity list to its committed src/node/entities.gen.ts (STA-1874)", () => {
    const { files, errors } = generateMember(packageWithModels("loyalty_kit"));
    expect(errors).toEqual([]);
    const paths = files.map((file) => file.path);
    expect(paths).toContain("src/node/entities.gen.ts");
    expect(paths.some((path) => path.startsWith(".stackra/gen/entities/"))).toBe(false);
  });

  it("refuses a package whose models span two modules, which one committed list cannot hold", () => {
    const { files, errors } = generateMember(packageWithModels("loyalty_kit", "rewards"));
    expect(files).toEqual([]);
    expect(errors.map((error) => error.code)).toEqual(["package_entities_modules"]);
  });
});
