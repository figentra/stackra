/**
 * Stackra file contract:
 * Purpose: `WEB_APP_IR`, an app member as discovery would read it: the `web` app on the web and iOS targets, hosting
 *          `@stackra/panel`, with two routes (one drawn on both runtimes, one on the browser only) and a block drawn
 *          on the browser only, each with the component files beside it. The route, block and app manifest tests run
 *          on it.
 * Boundary: test data only; never imported by package code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0249; ADR 0270 (decision 3); ADR 0294 (decisions 14 and 20).
 */
import type { MemberIR } from "#core/types/member-ir.type";

/** The web app, read. */
export const WEB_APP_IR: MemberIR = {
  member: "web",
  package: "@acme/web",
  version: "1.0.0",
  layout: "app",
  kind: "app",
  targets: ["web", "ios"],
  modules: ["web"],
  classes: [
    {
      name: "CtaBannerBlock",
      kind: "block",
      module: "web",
      file: "src/blocks/cta-banner/cta-banner.block.ts",
      importPath: "#blocks/cta-banner/cta-banner.block",
      options: { category: "marketing" },
      deps: [],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    },
    {
      name: "OrderDetailRoute",
      kind: "route",
      module: "web",
      file: "src/routes/order-detail/order-detail.route.ts",
      importPath: "#routes/order-detail/order-detail.route",
      options: { path: "/orders/:orderId" },
      deps: [],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    },
    {
      name: "SettingsRoute",
      kind: "route",
      module: "web",
      file: "src/routes/settings/settings.route.ts",
      importPath: "#routes/settings/settings.route",
      options: { path: "/settings" },
      deps: [],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    },
  ],
  shapes: [],
  enums: [],
  files: [
    {
      file: "src/blocks/cta-banner/cta-banner.tsx",
      importPath: "#blocks/cta-banner/cta-banner",
      folder: "blocks",
      names: [{ name: "CtaBanner", typeOnly: false }],
    },
    {
      file: "src/routes/order-detail/order-detail.tsx",
      importPath: "#routes/order-detail/order-detail",
      folder: "routes",
      names: [
        { name: "OrderDetailProps", typeOnly: true },
        { name: "OrderDetailPage", typeOnly: false },
      ],
    },
    {
      file: "src/routes/settings/settings.tsx",
      importPath: "#routes/settings/settings",
      folder: "routes",
      names: [{ name: "SettingsPage", typeOnly: false }],
    },
    {
      file: "src/routes/settings/settings.native.tsx",
      importPath: "#routes/settings/settings.native",
      folder: "routes",
      names: [{ name: "SettingsScreen", typeOnly: false }],
    },
  ],
  packages: ["@stackra/navigation", "@stackra/panel"],
  dependencies: [],
  errors: [],
};
