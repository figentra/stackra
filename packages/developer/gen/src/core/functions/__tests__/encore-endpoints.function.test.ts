/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreEndpoints`: one row per own action or query with an endpoint (export name, key, method,
 *          path, whether anonymous, class and input shape), then each own controller with a path (a trailing `/*` is
 *          Encore's `/*rest`), then a hosted package's entries and controllers when the host imports its root module;
 *          none for an entry without an endpoint, a controller without a path, or outside a service.
 * Boundary: test only; runs on the commerce IR fixture and the manifest `buildManifest` derives from it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 3); ADR 0294 (decision 21); STA-2838.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { buildManifest } from "#core/functions/build-manifest.function";
import { encoreEndpoints } from "#core/functions/encore-endpoints.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A class of the orders module with `kind` and `options`. */
function declared(
  name: string,
  kind: DeclaredClass["kind"],
  stem: string,
  options: Record<string, unknown>,
): DeclaredClass {
  return {
    name,
    kind,
    module: "orders",
    file: `src/modules/orders/${kind}/${stem}.${kind}.ts`,
    importPath: `#modules/orders/${kind}/${stem}.${kind}`,
    options,
    deps: [],
    facets: [],
    methods: ["handle"],
    refusals: [],
    statics: {},
    traits: [],
  };
}

const IR: MemberIR = {
  ...COMMERCE_IR,
  classes: [
    ...COMMERCE_IR.classes,
    declared("CheckHealthQuery", "query", "check-health", {
      key: "health.check",
      actors: ["anonymous"],
    }),
    declared("CountOrdersQuery", "query", "count-orders", { key: "order.count", endpoint: false }),
    declared("AuthCallbackController", "controller", "auth-callback", { path: "/api/auth/*" }),
    declared("RoomController", "controller", "room", { path: "/realtime/room" }),
    declared("NoPathController", "controller", "no-path", {}),
  ],
};
const MANIFEST = buildManifest(IR).manifest;

describe(encoreEndpoints, () => {
  const rows = encoreEndpoints(IR, MANIFEST);

  it("reads an action with its export, method, path, class and input shape, guarded", () => {
    const cancel = rows.find((row) => row.name === "ordersOrderCancelV1");
    expect(cancel).toEqual({
      kind: "call",
      name: "ordersOrderCancelV1",
      key: "orders.order.cancel@1",
      method: "PUT",
      path: "/app/orders/:orderId/cancel",
      anonymous: false,
      class: { name: "CancelOrderAction", from: "#modules/orders/actions/cancel-order.action" },
      input: {
        name: "CancelOrderInput",
        from: "#modules/orders/schemas/cancel-order-input.schema",
      },
    });
  });

  it("marks an entry whose actors list anonymous, and skips one without an endpoint", () => {
    expect(rows.find((row) => row.name === "ordersHealthCheckV1")).toMatchObject({
      kind: "call",
      anonymous: true,
      method: "GET",
    });
    expect(rows.some((row) => row.class.name === "CountOrdersQuery")).toBe(false);
  });

  it("reads the controllers with a path after the calls, naming Encore's wildcard", () => {
    expect(rows.filter((row) => row.kind === "controller")).toEqual([
      {
        kind: "controller",
        name: "authCallbackController",
        path: "/api/auth/*",
        route: "/api/auth/*rest",
        class: {
          name: "AuthCallbackController",
          from: "#modules/orders/controller/auth-callback.controller",
        },
      },
      {
        kind: "controller",
        name: "roomController",
        path: "/realtime/room",
        route: "/realtime/room",
        class: { name: "RoomController", from: "#modules/orders/controller/room.controller" },
      },
    ]);
    expect(rows.findIndex((row) => row.kind === "controller")).toBe(
      rows.filter((row) => row.kind === "call").length,
    );
  });

  it("reads a hosted package's entries and controllers only when the host imports its root module", () => {
    const cancel = (MANIFEST.actions ?? []).find((entry) => entry.key === "orders.order.cancel@1");
    const manifest = {
      ...MANIFEST,
      actions: [
        ...(MANIFEST.actions ?? []),
        { ...cancel, key: "kit.order.cancel@1", from: "@acme/kit" },
      ],
    } as StackraManifest;
    const kit = {
      member: "kit",
      package: "@acme/kit",
      modules: [{ key: "kit", class: "KitModule", file: "src/node/kit.module.ts", exports: [] }],
      services: [
        { class: "CancelOrderAction", from: "@acme/kit/node" },
        { class: "KitRoomController", from: "@acme/kit/node", path: "/kit/room" },
      ],
    } as unknown as StackraManifest;
    const hosting = encoreEndpoints(
      { ...IR, dependencies: [{ package: "@acme/kit", manifest: kit }] },
      manifest,
    );
    const hosted = hosting.find((row) => row.name === "kitOrderCancelV1");
    expect(hosted).toMatchObject({
      kind: "call",
      class: { name: "CancelOrderAction", from: "@acme/kit/node" },
    });
    // A hosted input class is not known, so its query string is not coerced.
    expect(hosted).not.toHaveProperty("input");
    expect(hosting).toContainEqual(
      expect.objectContaining({
        kind: "controller",
        name: "kitRoomController",
        route: "/kit/room",
      }),
    );
    const noRoot = {
      ...kit,
      modules: [{ key: "kit", class: "KitModule", exports: [] }],
    } as unknown as StackraManifest;
    const unhosted = encoreEndpoints(
      { ...IR, dependencies: [{ package: "@acme/kit", manifest: noRoot }] },
      manifest,
    );
    expect(
      unhosted.some((row) => row.name === "kitOrderCancelV1" || row.name === "kitRoomController"),
    ).toBe(false);
  });

  it("reads none outside a service", () => {
    expect(encoreEndpoints({ ...IR, layout: "package" }, MANIFEST)).toEqual([]);
    expect(encoreEndpoints({ ...IR, layout: "app" }, MANIFEST)).toEqual([]);
  });
});
