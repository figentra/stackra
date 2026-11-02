/**
 * Stackra file contract:
 * Purpose: unit tests of `uiRoutesOf`, `uiMenusOf`, `hostRoutesOf` and the route tables they feed: a package records
 *          the routes and menus of its `react` and `native` entries (with the page beside each route) in `ui.routes` and
 *          `ui.menus`, never a `node` one; an app lists them on the runtime their entry serves, imported from
 *          `<package>/<entry>`, a clashing class name imported under its module's, and registers every menu; one key
 *          from two owners, or the app's own, is refused.
 * Boundary: test only; runs on the loyalty kit and web app IR fixtures with UI classes added.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0111 (decisions 1, 3 and 4); ADR 0053; STA-1947.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";
import { buildManifest } from "#core/functions/build-manifest.function";
import { emitRoutes } from "#core/functions/emit-routes.function";
import { hostRoutesOf } from "#core/functions/host-routes-of.function";
import { uiMenusOf } from "#core/functions/ui-menus-of.function";
import { uiRoutesOf } from "#core/functions/ui-routes-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A UI class of the loyalty kit. */
const ui = (
  name: string,
  kind: string,
  file: string,
  options: Record<string, unknown>,
): DeclaredClass => ({
  name,
  kind,
  module: "loyalty_kit",
  file,
  importPath: `#${file.slice(4).replace(/\.tsx?$/, "")}`,
  options,
  deps: [],
  facets: [],
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
});

/** A page file beside a route. */
const page = (file: string, name: string) => ({
  file,
  importPath: `#${file.slice(4).replace(/\.tsx?$/, "")}`,
  folder: file.split("/")[1] ?? "",
  names: [{ name, typeOnly: false }],
});

const KIT: MemberIR = {
  ...LOYALTY_KIT_IR,
  classes: [
    ...LOYALTY_KIT_IR.classes,
    ui("PointsRoute", "route", "src/react/points/points.route.ts", { path: "/points" }),
    ui("PointsRoute", "route", "src/native/points/points.route.ts", { path: "/points" }),
    ui("MainMenu", "menu", "src/react/menus/main.menu.ts", { kind: "navigation" }),
    ui("StrayRoute", "route", "src/node/stray/stray.route.ts", { path: "/stray" }),
  ],
  files: [
    ...LOYALTY_KIT_IR.files,
    page("src/react/points/points.tsx", "Points"),
    page("src/native/points/points.native.tsx", "PointsScreen"),
  ],
};

describe("uiRoutesOf and uiMenusOf", () => {
  it("records a package's react and native routes with their pages, and its menus, never a node one", () => {
    expect(uiRoutesOf(KIT)).toEqual([
      {
        key: "loyalty_kit_points",
        module: "loyalty_kit",
        class: "PointsRoute",
        entry: "native",
        path: "/points",
        page: "PointsScreen",
      },
      {
        key: "loyalty_kit_points",
        module: "loyalty_kit",
        class: "PointsRoute",
        entry: "react",
        path: "/points",
        page: "Points",
      },
    ]);
    expect(uiMenusOf(KIT)).toEqual([
      {
        key: "loyalty_kit_main",
        module: "loyalty_kit",
        class: "MainMenu",
        entry: "react",
        kind: "navigation",
      },
    ]);
    const { manifest } = buildManifest(KIT);
    expect(Object.keys(manifest["ui"] as object)).toEqual(["routes", "menus"]);
    expect(buildManifest(LOYALTY_KIT_IR).manifest["ui"]).toBeUndefined();
    expect(uiRoutesOf(WEB_APP_IR)).toEqual([]);
  });
});

describe("the route tables of an app with UI dependencies", () => {
  const kit = buildManifest(KIT).manifest;
  const APP: MemberIR = {
    ...WEB_APP_IR,
    dependencies: [{ package: "@acme/loyalty-kit", manifest: kit }],
  };
  const [browser, native] = emitRoutes(APP).map((file) => file.content);

  it("lists each package route on the runtime its entry serves, with its page", () => {
    expect(browser).toContain(
      'import { MainMenu, Points, PointsRoute } from "@acme/loyalty-kit/react";',
    );
    expect(browser).toContain("  loyalty_kit_points: { route: PointsRoute, page: Points },");
    expect(native).toContain(
      'import { PointsRoute, PointsScreen } from "@acme/loyalty-kit/native";',
    );
    expect(native).toContain("  loyalty_kit_points: { route: PointsRoute, page: PointsScreen },");
  });

  it("registers the menus each runtime's entry ships", () => {
    expect(browser).toContain(
      'import { registerMenus, registerRoutes } from "@stackra/navigation";',
    );
    expect(browser).toContain(
      "export const menuTable = {\n  loyalty_kit_main: MainMenu,\n} as const;\n\nregisterMenus(menuTable);",
    );
    expect(native).not.toContain("registerMenus");
  });

  it("imports a clashing class under its module's name", () => {
    const own = {
      ...ui("PointsRoute", "route", "src/routes/my-points/my-points.route.ts", { path: "/mine" }),
      module: "web",
    };
    const content = emitRoutes({ ...APP, classes: [...APP.classes, own] })[0]?.content;
    expect(content).toContain("PointsRoute as LoyaltyKitPointsRoute");
    expect(content).toContain(
      "  loyalty_kit_points: { route: LoyaltyKitPointsRoute, page: Points },",
    );
  });

  it("refuses one key from two owners, or one the app has too", () => {
    const other: StackraManifest = {
      ...kit,
      package: "@acme/other",
      ui: {
        routes: [
          { key: "loyalty_kit_points", module: "other", class: "OtherRoute", entry: "react" },
        ],
      },
    };
    const twice = hostRoutesOf({
      ...APP,
      dependencies: [...APP.dependencies, { package: "@acme/other", manifest: other }],
    });
    expect(twice.errors.map((error) => [error.code, error.subject])).toEqual([
      ["route_duplicate", "loyalty_kit_points"],
    ]);
    const mine = ui("MainMenu", "menu", "src/menus/loyalty-kit-main.menu.ts", {
      kind: "navigation",
    });
    expect(
      hostRoutesOf({ ...APP, classes: [...APP.classes, mine] }).errors.map((error) => error.code),
    ).toEqual(["menu_duplicate"]);
  });
});
