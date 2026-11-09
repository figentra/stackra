/**
 * Stackra file contract:
 * Purpose: unit tests of `checkIdentityLock`: a changed identity fails with `identity_changed` and its fix, unless the
 *          class's `@Renamed` names the locked identity in full or as written; integrations, sequences, blocks and
 *          routes are locked too, and so are permissions (the set prefix renames), roles, reports, config keys, own
 *          schema names and endpoints (the bare path renames; a route that only gains its own area prefix passes once,
 *          STA-340), each class judged once; an event version bump passes
 *          (STA-2057); a removed class, a package's merged entries and generated entries are not this check's concern.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 5, 20 and 22); ADR 0305 (rule 5).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { checkIdentityLock } from "#core/functions/check-identity-lock.function";

/** A manifest with one action of `key` declared by `CancelOrderAction`. */
function withAction(key: string, extra: Record<string, unknown> = {}): StackraManifest {
  return {
    member: "commerce",
    package: "@acme/service-commerce",
    version: "1.0.0",
    actions: [
      {
        key,
        kind: "action",
        module: "orders",
        class: "CancelOrderAction",
        file: "src/modules/orders/actions/cancel-order.action.ts",
        permission: "orders.order.cancel",
        risk: "L2",
        ...extra,
      },
    ],
  };
}

/** A manifest whose `section` holds one entry of `key` declared by `Subject`. */
function keyed(section: string, key: string): StackraManifest {
  return {
    member: "web",
    package: "@acme/web",
    version: "1.0.0",
    [section]: [{ key, class: "Subject", module: "web", file: "src/subject.ts" }],
  };
}

/** A manifest with one entry in `section`, merged with `extra` entry fields. */
const one = (section: string, entry: Record<string, unknown>): StackraManifest =>
  ({
    member: "shop",
    package: "@acme/shop",
    version: "1.0.0",
    [section]: [{ class: "Subject", module: "shop", file: "src/subject.ts", ...entry }],
  }) as StackraManifest;

/** A manifest whose `schemas` map is `value`. */
const schemas = (value: Record<string, unknown>): StackraManifest =>
  ({
    member: "shop",
    package: "@acme/shop",
    version: "1.0.0",
    schemas: value,
  }) as StackraManifest;
/** A manifest with one integration event of wire name `name`. */
const event = (name: string): StackraManifest => one("events", { name });

/** A manifest with one generated action of `key`, written by gen under `.stackra/`. */
const generated = (key: string): StackraManifest =>
  withAction(key, { file: ".stackra/gen/reports/order-totals.query.ts" });
/** A manifest with `OrderPermissions` declaring `read` and `cancel` in `module`. */
const statics = (module: string): StackraManifest =>
  ({
    ...one("permissions", {}),
    permissions: ["read", "cancel"].map((member) => ({
      key: `${module}.order.${member}`,
      class: "OrderPermissions",
      module,
      member,
      risk: "L1",
      file: "src/order.permissions.ts",
    })),
  }) as StackraManifest;
/** A manifest with the model `Order` in `module` and its schema. */
const model = (module: string): StackraManifest =>
  ({
    ...one("models", { key: `${module}.order`, class: "Order", module }),
    schemas: { [`${module}.Order`]: {} },
  }) as StackraManifest;

/** The cancel action at `method path`, recorded under `area` when one is given. */
const routed = (method: string, path: string, area?: string): StackraManifest =>
  withAction("orders.order.cancel@1", {
    endpoint: { method, path },
    ...(area === undefined ? {} : { area }),
  });

describe("checkIdentityLock", () => {
  it("fails a changed identity with its fix", () => {
    const [error, ...rest] = checkIdentityLock(
      withAction("orders.order.cancel@1"),
      withAction("orders.order.void@1"),
      new Map(),
    );
    expect(rest).toEqual([]);
    expect(error).toMatchObject({
      code: "identity_changed",
      file: "src/modules/orders/actions/cancel-order.action.ts",
      subject: "CancelOrderAction",
      message: "the locked identity `orders.order.cancel@1` became `orders.order.void@1`",
    });
    expect(error?.fix).toContain('@Renamed("orders.order.cancel@1")');
  });

  it("accepts a rename that names the locked identity", () => {
    const previous = withAction("orders.order.cancel@1");
    const next = withAction("orders.order.void@1");
    expect(
      checkIdentityLock(previous, next, new Map([["CancelOrderAction", "orders.order.cancel@1"]])),
    ).toEqual([]);
    expect(
      checkIdentityLock(previous, next, new Map([["CancelOrderAction", "order.cancel"]])),
    ).toEqual([]);
    expect(
      checkIdentityLock(previous, next, new Map([["CancelOrderAction", "order.other"]])),
    ).toHaveLength(1);
  });

  it("ignores unchanged, removed and merged entries", () => {
    const previous = withAction("orders.order.cancel@1");
    expect(checkIdentityLock(previous, previous, new Map())).toEqual([]);
    expect(checkIdentityLock(previous, { ...previous, actions: [] }, new Map())).toEqual([]);
    expect(
      checkIdentityLock(previous, withAction("x.y.z@1", { from: "@acme/kit" }), new Map()),
    ).toEqual([]);
  });

  it("ignores a generated entry whose key changed", () => {
    // The report and search queries gen writes under `.stackra/`: their source class is locked instead (EC-04).
    expect(
      checkIdentityLock(
        generated("orders.order.totals@1"),
        generated("sales.order.totals@1"),
        new Map(),
      ),
    ).toEqual([]);
  });

  it("locks integration, sequence, block and route keys", () => {
    for (const section of ["integrations", "sequences", "blocks", "routes"]) {
      const errors = checkIdentityLock(
        keyed(section, "web.old"),
        keyed(section, "web.new"),
        new Map(),
      );
      expect(errors.map((error) => error.code)).toEqual(["identity_changed"]);
      expect(
        checkIdentityLock(
          keyed(section, "web.old"),
          keyed(section, "web.new"),
          new Map([["Subject", "web.old"]]),
        ),
      ).toEqual([]);
    }
  });

  it("locks permissions, with the set prefix as a rename", () => {
    const before = one("permissions", { key: "shop.order.read", member: "read" });
    const after = one("permissions", { key: "sales.order.read", member: "read" });
    const [error] = checkIdentityLock(before, after, new Map());
    expect(error).toMatchObject({ code: "identity_changed", subject: "Subject.read" });
    for (const old of ["shop.order", "shop.order.read"])
      expect(checkIdentityLock(before, after, new Map([["Subject", old]]))).toEqual([]);
    for (const old of ["shop.other", "shop"])
      expect(checkIdentityLock(before, after, new Map([["Subject", old]]))).toHaveLength(1);
  });

  it("names the set prefix in every permission's fix", () => {
    const errors = checkIdentityLock(statics("shop"), statics("sales"), new Map());
    expect(errors.map((error) => error.subject)).toEqual([
      "OrderPermissions.read",
      "OrderPermissions.cancel",
    ]);
    for (const error of errors)
      expect(error.fix).toContain('@Renamed("shop.order") to OrderPermissions');
    expect(
      checkIdentityLock(
        statics("shop"),
        statics("sales"),
        new Map([["OrderPermissions", "shop.order"]]),
      ),
    ).toEqual([]);
  });

  it("locks roles, reports and config keys", () => {
    for (const section of ["roles", "reports", "config"]) {
      const extra = section === "config" ? { from: "@acme/shop" } : {};
      const before = one(section, { key: "shop.old", ...extra });
      const after = one(section, { key: "shop.new", ...extra });
      expect(checkIdentityLock(before, after, new Map()).map((error) => error.code)).toEqual([
        "identity_changed",
      ]);
      expect(checkIdentityLock(before, after, new Map([["Subject", "old"]]))).toEqual([]);
      expect(checkIdentityLock(before, before, new Map())).toEqual([]);
    }
  });

  it("locks own schema names, not enums, duplicates or generated entries", () => {
    expect(
      checkIdentityLock(schemas({ "shop.Page": {} }), schemas({ "sales.Page": {} }), new Map()),
    ).toHaveLength(1);
    expect(
      checkIdentityLock(
        schemas({ "shop.Page": {} }),
        schemas({ "sales.Page": {} }),
        new Map([["Page", "shop.Page"]]),
      ),
    ).toEqual([]);
    expect(
      checkIdentityLock(
        schemas({ "shop.Kind": { enum: ["a"] } }),
        schemas({ "sales.Kind": { enum: ["a"] } }),
        new Map(),
      ),
    ).toEqual([]);
    expect(
      checkIdentityLock(
        schemas({ "shop.Page": {}, "web.Page": {} }),
        schemas({ "sales.Page": {}, "web.Page": {} }),
        new Map(),
      ),
    ).toEqual([]);
    expect(
      checkIdentityLock(
        schemas({ "shop.ReplicaPage": {}, "shop.SearchQueryInput": {} }),
        schemas({ "sales.ReplicaPage": {}, "sales.SearchQueryInput": {} }),
        new Map(),
      ),
    ).toEqual([]);
  });

  it("locks an endpoint, by bare path, and judges a class once", () => {
    const endpointed = (key: string, method: string, path: string): StackraManifest =>
      withAction(key, { endpoint: { method, path } });
    const before = endpointed("orders.order.cancel@1", "POST", "/orders/cancel");
    const moved = endpointed("orders.order.cancel@1", "PUT", "/orders/:orderId/cancel");
    const [error, ...rest] = checkIdentityLock(before, moved, new Map());
    expect(rest).toEqual([]);
    expect(error?.message).toBe(
      "the locked identity `POST /orders/cancel` became `PUT /orders/:orderId/cancel`",
    );
    expect(error?.fix).toContain('endpoint: { method: "POST", path: "/orders/cancel" }');
    for (const old of ["POST /orders/cancel", "/orders/cancel"])
      expect(checkIdentityLock(before, moved, new Map([["CancelOrderAction", old]]))).toEqual([]);
    // The key changed with the endpoint: one refusal, for the key.
    const both = endpointed("orders.order.void@1", "PUT", "/orders/:orderId/void");
    expect(checkIdentityLock(before, both, new Map())).toHaveLength(1);
    // Gaining an endpoint is not a move.
    expect(checkIdentityLock(withAction("orders.order.cancel@1"), moved, new Map())).toEqual([]);
  });

  it("accepts an endpoint that only gains its own area prefix, once (STA-340)", () => {
    const before = routed("PUT", "/orders/:orderId/cancel");
    // Its own area: accepted with no @Renamed.
    expect(
      checkIdentityLock(before, routed("PUT", "/app/orders/:orderId/cancel", "app"), new Map()),
    ).toEqual([]);
    // Another area than the entry's own: refused.
    expect(
      checkIdentityLock(before, routed("PUT", "/admin/orders/:orderId/cancel", "app"), new Map()),
    ).toHaveLength(1);
    // A method change with the prefix: refused.
    expect(
      checkIdentityLock(before, routed("POST", "/app/orders/:orderId/cancel", "app"), new Map()),
    ).toHaveLength(1);
    // A route already under an area moving again: refused.
    expect(
      checkIdentityLock(
        routed("PUT", "/app/orders/:orderId/cancel", "app"),
        routed("PUT", "/admin/app/orders/:orderId/cancel", "admin"),
        new Map(),
      ),
    ).toHaveLength(1);
  });

  it("judges a model whose key changed once, not again by its schema name", () => {
    expect(
      checkIdentityLock(model("shop"), model("sales"), new Map()).map((error) => error.subject),
    ).toEqual(["Order"]);
    expect(
      checkIdentityLock(model("shop"), model("sales"), new Map([["Order", "shop.order"]])),
    ).toEqual([]);
  });

  it("accepts an event version bump and refuses a lower version", () => {
    expect(
      checkIdentityLock(event("orders.order.paid.v1"), event("orders.order.paid.v2"), new Map()),
    ).toEqual([]);
    expect(
      checkIdentityLock(event("orders.order.paid.v2"), event("orders.order.paid.v1"), new Map()),
    ).toHaveLength(1);
  });
});

/** A manifest with one settings group `key` of `className` (`OrdersSettings` by default) holding `keys`. */
function withSettings(
  key: string,
  keys: readonly { path: string; renamed?: readonly string[] }[],
  className = "OrdersSettings",
): StackraManifest {
  return {
    member: "web",
    package: "@acme/web",
    version: "1.0.0",
    settings: [
      {
        key,
        class: className,
        module: "orders",
        file: "src/modules/orders/orders.settings.ts",
        keys: keys.map((entry) => ({ type: "string", ...entry })),
      },
    ],
  };
}

describe("checkIdentityLock settings (STA-2056)", () => {
  it("refuses a renamed class's new group key, unless @Renamed names the old key", () => {
    const previous = withSettings("orders", [{ path: "note" }]);
    const next = withSettings("order", [{ path: "note" }], "OrderSettings");
    const [error, ...rest] = checkIdentityLock(previous, next, new Map());
    expect(rest).toEqual([]);
    expect(error).toMatchObject({ code: "identity_changed", subject: "OrderSettings" });
    expect(error?.fix).toContain('@Renamed("orders")');
    expect(checkIdentityLock(previous, next, new Map([["OrderSettings", "orders"]]))).toEqual([]);
    expect(checkIdentityLock(previous, previous, new Map())).toEqual([]);
  });

  it("locks the key paths of a renamed group against its old group", () => {
    const [error] = checkIdentityLock(
      withSettings("orders", [{ path: "note" }]),
      withSettings("order", [{ path: "memo" }], "OrderSettings"),
      new Map([["OrderSettings", "orders"]]),
    );
    expect(error).toMatchObject({ code: "identity_changed", subject: "OrderSettings.memo" });
  });

  it("passes a removed group with no group gained", () => {
    expect(
      checkIdentityLock(
        withSettings("orders", [{ path: "note" }]),
        { ...withSettings("x", []), settings: [] },
        new Map(),
      ),
    ).toEqual([]);
  });

  it("refuses a renamed key path without @Renamed, and accepts it with one", () => {
    const previous = withSettings("orders", [{ path: "note" }]);
    const [error] = checkIdentityLock(
      previous,
      withSettings("orders", [{ path: "memo" }]),
      new Map(),
    );
    expect(error).toMatchObject({ code: "identity_changed", subject: "OrdersSettings.memo" });
    expect(error?.fix).toContain('@Renamed("note")');
    expect(
      checkIdentityLock(
        previous,
        withSettings("orders", [{ path: "memo", renamed: ["note"] }]),
        new Map(),
      ),
    ).toEqual([]);
  });

  it("asks for @Renamed on the section field when a section moved", () => {
    const [error] = checkIdentityLock(
      withSettings("orders", [{ path: "notes.memo" }]),
      withSettings("orders", [{ path: "remarks.memo" }]),
      new Map(),
    );
    expect(error?.fix).toContain('@Renamed("notes") to the renamed section field');
  });

  it("passes a plain removal and a plain addition", () => {
    const previous = withSettings("orders", [{ path: "note" }, { path: "memo" }]);
    expect(
      checkIdentityLock(previous, withSettings("orders", [{ path: "note" }]), new Map()),
    ).toEqual([]);
    expect(
      checkIdentityLock(
        withSettings("orders", [{ path: "note" }]),
        withSettings("orders", [{ path: "note" }, { path: "extra" }]),
        new Map(),
      ),
    ).toEqual([]);
  });
});
