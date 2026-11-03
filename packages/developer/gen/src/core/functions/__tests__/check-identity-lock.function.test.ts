/**
 * Stackra file contract:
 * Purpose: unit tests of `checkIdentityLock`: a changed identity fails with `identity_changed` and its fix, unless the
 *          class's `@Renamed` names the locked identity in full or as written; integrations, sequences, blocks and
 *          routes are locked too; a removed class and a package's merged entries are not this check's concern.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 5 and 22).
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
});

/** A manifest with one settings group `key` of `OrdersSettings` holding `keys`. */
function withSettings(
  key: string,
  keys: readonly { path: string; renamed?: readonly string[] }[],
): StackraManifest {
  return {
    member: "web",
    package: "@acme/web",
    version: "1.0.0",
    settings: [
      {
        key,
        class: "OrdersSettings",
        module: "orders",
        file: "src/modules/orders/orders.settings.ts",
        keys: keys.map((entry) => ({ type: "string", ...entry })),
      },
    ],
  };
}

describe("checkIdentityLock settings (STA-2056)", () => {
  it("locks a group key by its class, unless @Renamed names the old key", () => {
    const previous = withSettings("orders", [{ path: "note" }]);
    const next = withSettings("orders_policy", [{ path: "note" }]);
    expect(checkIdentityLock(previous, next, new Map()).map((error) => error.subject)).toEqual([
      "OrdersSettings",
    ]);
    expect(checkIdentityLock(previous, next, new Map([["OrdersSettings", "orders"]]))).toEqual([]);
    expect(checkIdentityLock(previous, previous, new Map())).toEqual([]);
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
