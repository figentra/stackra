/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRoutes`: one route table per client runtime of an app, each route under its key with the
 *          page beside it on that runtime (none where the runtime has no page), the `registerRoutes(routeTable)` call,
 *          and `registerPanelPages()` on the browser of an app that hosts the panel, with `registerResources` over the
 *          declared manifests' `ui.resources` trees (first wins, sorted) and their derived `resourceLabelKeys`
 *          (STA-1385); nothing for an app without routes or a member that is not an app.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 14, 20 and 22); ADR 0297; ADR 0307.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitRoutes } from "#core/functions/emit-routes.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitRoutes", () => {
  const files = emitRoutes(WEB_APP_IR);
  const browser = files.find((file) => file.path === ".stackra/gen/routes/browser.ts")?.content;
  const native = files.find((file) => file.path === ".stackra/gen/routes/native.ts")?.content;

  it("writes one table per client runtime", () => {
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/gen/routes/browser.ts",
      ".stackra/gen/routes/native.ts",
    ]);
  });

  it("binds each route to the page beside it on that runtime", () => {
    expect(browser).toContain(
      [
        "export const routeTable = {",
        "  order_detail: { route: OrderDetailRoute, page: OrderDetailPage },",
        "  settings: { route: SettingsRoute, page: SettingsPage },",
        "} as const;",
      ].join("\n"),
    );
    expect(native).toContain("  order_detail: { route: OrderDetailRoute },");
    expect(native).toContain("  settings: { route: SettingsRoute, page: SettingsScreen },");
    expect(browser).toContain('import { SettingsPage } from "#routes/settings/settings";');
    expect(native).toContain('import { SettingsScreen } from "#routes/settings/settings.native";');
  });

  it("registers the table, and the panel's pages on the browser", () => {
    expect(browser).toContain('import { registerRoutes } from "@stackra/navigation";');
    expect(browser).toContain('import { registerPanelPages } from "@stackra/panel/react";');
    expect(browser).toContain("registerRoutes(routeTable);\nregisterPanelPages();");
    expect(native).toContain("registerRoutes(routeTable);");
    expect(native).not.toContain("registerPanelPages");
    const withoutPanel = emitRoutes({ ...WEB_APP_IR, packages: ["@stackra/navigation"] });
    expect(withoutPanel[0]?.content).not.toContain("registerPanelPages");
  });

  it("registers the declared manifests' resource trees and lists their label keys (STA-1385)", () => {
    const tree = {
      options: {},
      table: { columns: [{ kind: "value", key: "placedAt" }], filters: [] },
    };
    const orders = {
      package: "@acme/orders",
      manifest: {
        member: "orders",
        package: "@acme/orders",
        version: "0.1.0",
        ui: { resources: { "orders.order": tree, "orders.line": {} } },
      },
    };
    const shadow = {
      package: "@acme/shadow",
      manifest: {
        member: "shadow",
        package: "@acme/shadow",
        version: "0.1.0",
        ui: { resources: { "orders.order": { options: { shadowed: true } } } },
      },
    };
    const [web, device] = emitRoutes({ ...WEB_APP_IR, dependencies: [orders, shadow] });
    const content = web?.content ?? "";
    expect(content).toContain('import { registerResources } from "@stackra/panel";');
    expect(content).toContain(`  "orders.order": ${JSON.stringify(tree)},`);
    expect(content).not.toContain("shadowed");
    expect(content.indexOf('"orders.line"')).toBeLessThan(content.indexOf('"orders.order":'));
    expect(content).toContain("registerPanelPages();\n\n/** The recorded resource trees");
    expect(content).toContain("registerResources(resourceTrees);");
    expect(content).toContain(
      'export const resourceLabelKeys = [\n  "orders::resources.line.title",\n  "orders::resources.order.columns.placed_at",\n  "orders::resources.order.title",\n] as const;',
    );
    expect(device?.content).not.toContain("registerResources");
    expect(emitRoutes(WEB_APP_IR)[0]?.content).not.toContain("registerResources");
  });

  it("writes nothing without routes or outside an app", () => {
    expect(emitRoutes({ ...WEB_APP_IR, classes: [] })).toEqual([]);
    expect(emitRoutes(COMMERCE_IR)).toEqual([]);
  });
});
