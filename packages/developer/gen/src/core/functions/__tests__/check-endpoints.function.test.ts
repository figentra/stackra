/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEndpoints`: one fixture per refusal (`endpoint_collision`, `endpoint_versioned`,
 *          `endpoint_area_mismatch`, `endpoint_method_mismatch`, `job_without_system_actor`, `cron_input_invalid`,
 *          `intent_phrases_missing`) beside a conforming one that passes, and the edge cases of the spec (a call
 *          without a route, hosted entries, the bare area prefix, whole version segments, the cron and intent
 *          fallbacks).
 * Boundary: test only; builds manifests by hand and runs the intent check on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 21); ADR 0305 (rule 30); ADR 0082; ADR 0118;
 *                     STA-340.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { checkEndpoints } from "#core/functions/check-endpoints.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

type Entry = NonNullable<StackraManifest["actions"]>[number];

/** An IR with no classes, so only the manifest decides. */
const BARE: MemberIR = { ...COMMERCE_IR, classes: [], catalogues: {} };

/** One manifest entry: `orders.<key>@1`, in the app area unless `extra` says otherwise. */
function entry(key: string, kind: "action" | "query", extra: Record<string, unknown> = {}): Entry {
  return {
    key: `orders.${key}@1`,
    kind,
    module: "orders",
    class: `${key.replaceAll(".", "_")}_${kind}`,
    file: `src/modules/orders/${kind}s/${key}.${kind}.ts`,
    permission: `orders.${key}`,
    risk: "L1",
    actors: ["user"],
    area: "app",
    ...extra,
  };
}

/** A derived or written route. */
const route = (method: string, path: string, derived = true) => ({ method, path, derived });

/** The codes and subjects `checkEndpoints` reports for these entries and schemas. */
function check(
  actions: readonly Entry[],
  schemas: Record<string, unknown> = {},
  ir: MemberIR = BARE,
): [string, string][] {
  const manifest = { member: "orders", actions, schemas } as unknown as StackraManifest;
  return checkEndpoints(ir, manifest).map((error) => [error.code, error.subject]);
}

describe("checkEndpoints: routes", () => {
  // @covers sta-340:FR-003
  it("refuses two calls of one route shape, naming each, and accepts another method on the path", () => {
    const get = entry("order.get", "query", {
      endpoint: route("GET", "/app/orders/:orderId"),
    });
    const show = entry("order.show", "query", { endpoint: route("GET", "/app/orders/:id", false) });
    expect(check([get, show])).toEqual([
      ["endpoint_collision", get.class],
      ["endpoint_collision", show.class],
    ]);
    const remove = entry("order.delete", "action", {
      endpoint: route("DELETE", "/app/orders/:orderId"),
    });
    expect(check([get, remove])).toEqual([]);
  });

  it("counts a hosted entry in the collision check only", () => {
    const own = entry("session.list", "query", { endpoint: route("GET", "/app/sessions") });
    const hosted = entry("session.all", "query", {
      endpoint: route("POST", "/sessions", false),
      from: "@stackra/identity",
    });
    expect(check([own, hosted])).toEqual([]);
    expect(check([own, { ...hosted, endpoint: route("GET", "/app/sessions") }])).toEqual([
      ["endpoint_collision", own.class],
      ["endpoint_collision", hosted.class],
    ]);
  });

  it("counts own and hosted raw controllers, on every method and under a wildcard", () => {
    // Hosted entries, so only the collision check reads them (their paths sit outside the app area).
    const stream = entry("room.stream", "query", {
      endpoint: route("GET", "/realtime/room", false),
      from: "@acme/rooms",
    });
    const kit = {
      member: "kit",
      modules: [{ key: "kit", class: "KitModule", file: "src/node/kit.module.ts", exports: [] }],
      services: [{ class: "RoomController", from: "@acme/kit/node", path: "/realtime/room" }],
    } as unknown as StackraManifest;
    const hosting: MemberIR = { ...BARE, dependencies: [{ package: "@acme/kit", manifest: kit }] };
    expect(check([stream], {}, hosting)).toEqual([["endpoint_collision", "RoomController"]]);
    const unhosted = {
      ...kit,
      modules: [{ key: "kit", class: "KitModule", exports: [] }],
    } as unknown as StackraManifest;
    expect(
      check(
        [stream],
        {},
        { ...BARE, dependencies: [{ package: "@acme/kit", manifest: unhosted }] },
      ),
    ).toEqual([]);
    const auth = {
      name: "AuthController",
      kind: "controller",
      module: "orders",
      file: "src/modules/orders/raw/auth.controller.ts",
      importPath: "#modules/orders/raw/auth.controller",
      options: { path: "/api/auth/*" },
      deps: [],
      facets: [],
      methods: ["handle"],
      refusals: [],
      statics: {},
      traits: [],
    } as DeclaredClass;
    const callback = entry("auth.callback", "action", {
      endpoint: route("POST", "/api/auth/callback", false),
      from: "@acme/auth",
    });
    expect(check([callback], {}, { ...BARE, classes: [auth] })).toEqual([
      ["endpoint_collision", "AuthController"],
    ]);
    expect(check([stream], {}, { ...BARE, classes: [auth] })).toEqual([]);
  });

  // @covers sta-340:FR-004
  it("refuses a whole version segment, and no other segment", () => {
    const versioned = entry("order.create", "action", {
      endpoint: route("POST", "/app/v2/orders", false),
    });
    expect(check([versioned])).toEqual([["endpoint_versioned", versioned.class]]);
    expect(
      check([
        entry("order.create", "action", { endpoint: route("POST", "/app/orders/v10", false) }),
      ]),
    ).toEqual([["endpoint_versioned", "order_create_action"]]);
    expect(
      check([entry("video.list", "query", { endpoint: route("GET", "/app/videos/:v2Id", false) })]),
    ).toEqual([]);
  });

  // @covers sta-340:FR-005
  it("refuses a path outside its area, and accepts the bare prefix", () => {
    const verify = entry("award.verify", "query", {
      area: "public",
      endpoint: route("GET", "/awards/verify", false),
    });
    expect(check([verify])).toEqual([["endpoint_area_mismatch", verify.class]]);
    expect(
      check([
        entry("publication.list", "query", {
          area: "public",
          endpoint: route("GET", "/publications", false),
        }),
      ]),
    ).toEqual([["endpoint_area_mismatch", "publication_list_query"]]);
    expect(
      check([entry("health.get", "query", { area: "public", endpoint: route("GET", "/public") })]),
    ).toEqual([]);
    const defaulted = entry("order.list", "query", {
      area: undefined,
      endpoint: route("GET", "/admin/orders"),
    });
    expect(check([defaulted])).toEqual([["endpoint_area_mismatch", defaulted.class]]);
  });

  it("accepts a public call under /.well-known/, and only a public one", () => {
    const frameAncestors = entry("frame-ancestors.get", "query", {
      area: "public",
      endpoint: route("GET", "/.well-known/stackra/frame-ancestors", false),
    });
    expect(check([frameAncestors])).toEqual([]);
    expect(check([{ ...frameAncestors, area: "app" }])).toEqual([
      ["endpoint_area_mismatch", frameAncestors.class],
    ]);
    expect(
      check([
        {
          ...frameAncestors,
          endpoint: route("POST", "/.well-known/stackra/frame-ancestors", false),
        },
      ]),
    ).toEqual([["endpoint_method_mismatch", frameAncestors.class]]);
  });

  // @covers sta-340:FR-006
  it("refuses a method that contradicts the kind or the transition", () => {
    const query = entry("order.search", "query", {
      endpoint: route("POST", "/app/orders/search", false),
    });
    const action = entry("order.archive", "action", {
      endpoint: route("GET", "/app/orders/archive", false),
    });
    const transition = entry("order.cancel", "action", {
      endpoint: route("POST", "/app/orders/:orderId/cancel", false),
      input: { $ref: "#/schemas/orders.CancelOrderInput" },
    });
    const schemas = {
      "orders.CancelOrderInput": { type: "object", properties: { orderId: { type: "string" } } },
    };
    expect(check([query, action, transition], schemas)).toEqual([
      ["endpoint_method_mismatch", query.class],
      ["endpoint_method_mismatch", action.class],
      ["endpoint_method_mismatch", transition.class],
    ]);
    const put = { ...transition, endpoint: route("PUT", "/app/orders/:orderId/cancel", false) };
    const notTransition = {
      ...transition,
      input: { $ref: "#/schemas/orders.CancelByReferenceInput" },
    };
    expect(check([put], schemas)).toEqual([]);
    expect(
      check([notTransition], {
        "orders.CancelByReferenceInput": {
          type: "object",
          properties: { reference: { type: "string" } },
        },
      }),
    ).toEqual([]);
  });

  it("skips a call without a route", () => {
    expect(
      check([
        entry("order.expire", "action", { actors: ["system"] }),
        entry("order.close", "action", { endpoint: false }),
      ]),
    ).toEqual([]);
  });
});

describe("checkEndpoints: jobs and intents", () => {
  // @covers sta-340:FR-007
  it("refuses a job without the system or job actor", () => {
    const user = entry("order.export", "action", { job: { timeout: "5m" } });
    expect(check([user])).toEqual([["job_without_system_actor", user.class]]);
    expect(check([{ ...user, actors: ["user", "job"] }])).toEqual([]);
  });

  // @covers sta-340:FR-008
  it("refuses each unknown, missing or wrongly typed cron input property", () => {
    const expire = entry("points.expire", "action", {
      actors: ["system"],
      input: { $ref: "#/schemas/orders.ExpirePointsInput" },
      job: { cron: { schedule: "0 3 * * *", input: { batchSize: "x", extra: 1 } } },
    });
    const schemas = {
      "orders.ExpirePointsInput": {
        type: "object",
        properties: { batchSize: { type: "integer" }, scope: { type: "string" } },
        required: ["scope"],
      },
    };
    expect(check([expire], schemas)).toEqual([
      ["cron_input_invalid", `${expire.class}.batchSize`],
      ["cron_input_invalid", `${expire.class}.extra`],
      ["cron_input_invalid", `${expire.class}.scope`],
    ]);
    const good = {
      ...expire,
      job: { cron: { schedule: "0 3 * * *", input: { batchSize: 500, scope: "all" } } },
    };
    expect(check([good], schemas)).toEqual([]);
  });

  it("falls back for an action without input, and for a schema it cannot read", () => {
    const bare = entry("index.rebuild", "action", { actors: ["system"] });
    const withInput = (input: object) => ({
      ...bare,
      job: { cron: { schedule: "0 * * * *", input } },
    });
    expect(check([withInput({})])).toEqual([]);
    expect(check([withInput({ full: true })])).toEqual([["cron_input_invalid", bare.class]]);
    const opaque = {
      ...withInput({ anything: 1 }),
      input: { $ref: "#/schemas/orders.RebuildInput" },
    };
    expect(check([opaque], { "orders.RebuildInput": { required: ["anything"] } })).toEqual([]);
    expect(check([opaque], { "orders.RebuildInput": { required: ["since"] } })).toEqual([
      ["cron_input_invalid", `${bare.class}.since`],
    ]);
  });

  // @covers sta-340:FR-009
  it("refuses `intent: true` without phrases in a base locale, and falls back to en", () => {
    const balance: DeclaredClass = {
      ...(COMMERCE_IR.classes.find((declared) => declared.kind === "query") as DeclaredClass),
      name: "GetBalanceQuery",
      module: "loyalty_kit",
      options: { key: "points.balance", intent: true },
    };
    const ir = (catalogues: MemberIR["catalogues"]): MemberIR => ({
      ...BARE,
      classes: [balance],
      ...(catalogues !== undefined ? { catalogues } : {}),
    });
    const phrases = { actions: { points: { balance: { intents: ["how many points"] } } } };
    const errors = (catalogues: MemberIR["catalogues"]) =>
      checkEndpoints(ir(catalogues), { member: "x" } as unknown as StackraManifest).map((error) => [
        error.code,
        error.file,
      ]);
    expect(
      errors({ en: { loyalty_kit: phrases }, "en-US": { loyalty_kit: {} }, ar: { other: {} } }),
    ).toEqual([]);
    expect(errors({ en: { loyalty_kit: phrases }, ar: { loyalty_kit: { actions: {} } } })).toEqual([
      ["intent_phrases_missing", "assets/lang/ar/loyalty_kit.json"],
    ]);
    expect(
      errors({ en: { loyalty_kit: { actions: { points: { balance: { intents: [] } } } } } }),
    ).toEqual([["intent_phrases_missing", "assets/lang/en/loyalty_kit.json"]]);
    // Reported in locale order whatever order discovery read the folders in, as checkI18n does.
    expect(errors({ fil: { loyalty_kit: {} }, ar: { loyalty_kit: {} } })).toEqual([
      ["intent_phrases_missing", "assets/lang/ar/loyalty_kit.json"],
      ["intent_phrases_missing", "assets/lang/fil/loyalty_kit.json"],
    ]);
    expect(errors(undefined)).toEqual([
      ["intent_phrases_missing", "assets/lang/en/loyalty_kit.json"],
    ]);
  });
});
