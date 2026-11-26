/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreApi`: a service gets `stackra-encore/<member>/api.ts` with one `api()` per own
 *          action and query that has an endpoint, named by its camel-cased key and version, with the entry's method and
 *          path, typed by its input and output schemas, answered by the `answerCall` helper (`api.raw`, `auth: false` to Encore, the pipeline run with the
 *          verified actor); only an anonymous entry opens to a call with no credential; a controller is a raw `*`
 *          endpoint; an entry with no endpoint gets no adapter, nor a hosted entry unless the host imports its package's root
 *          module, when its actions and controllers get the same adapters; a package, an app and a service with no such entry get no file.
 * Boundary: test only; runs on the commerce IR fixture and the manifest `buildManifest` derives from it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 21); ADR 0098; STA-2025; STA-2063 (FR-002 to
 *                     FR-006).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEncoreApi } from "#core/functions/emit-encore-api.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The entry import of a generated stackra-encore/<service>/ file; a constant so validate does not read it as this test's own import. */
const GENERATED_ENTRY = "../../.stackra/entry/server";

/** A query of the commerce module, without input or output. */
function query(name: string, stem: string, options: Record<string, unknown>): DeclaredClass {
  return {
    name,
    kind: "query",
    module: "orders",
    file: `src/modules/orders/queries/${stem}.query.ts`,
    importPath: `#modules/orders/queries/${stem}.query`,
    options,
    deps: [],
    facets: [],
    methods: ["handle"],
    refusals: [],
    statics: {},
    traits: [],
  };
}

/** A schema shape without fields. */
function shape(name: string, module: string, stem: string): ShapeIR {
  const file = `src/modules/${module}/schemas/${stem}.schema.ts`;
  return {
    name,
    kind: "schema",
    module,
    file,
    importPath: `#modules/${module}/schemas/${stem}.schema`,
    fields: [],
    relations: [],
  };
}

describe(emitEncoreApi, () => {
  const ir: MemberIR = {
    ...COMMERCE_IR,
    classes: [
      ...COMMERCE_IR.classes,
      query("CheckHealthQuery", "check-health", {
        key: "health.check",
        actors: ["anonymous", "user"],
      }),
      query("CountOrdersQuery", "count-orders", { key: "order.count", endpoint: false }),
    ],
    shapes: [
      ...COMMERCE_IR.shapes,
      // Names the file binds itself, or another module's shape already took.
      shape("ActionPipeline", "orders", "action-pipeline"),
      shape("Summary", "orders", "summary"),
      shape("Summary", "billing", "summary"),
    ],
  };
  const built = buildManifest(ir).manifest;
  const entries = built.actions ?? [];
  type Entry = (typeof entries)[number];
  // Both are in `ir`, so the lookups always find them; the casts keep the spreads below complete.
  const cancel = entries.find((entry) => entry.key === "orders.order.cancel@1") as Entry;
  const list = entries.find((entry) => entry.key === "orders.order.list@1") as Entry;
  const manifest: StackraManifest = {
    ...built,
    actions: [
      ...entries,
      // A hosted package's entry: its schemas' files are not known, so it gets no adapter yet.
      { ...cancel, key: "kit.order.cancel@1", from: "@acme/kit" },
      // A schema the member does not declare, as input and as output.
      { ...cancel, key: "orders.order.void@1", input: { $ref: "#/schemas/orders.VoidOrderInput" } },
      {
        ...cancel,
        key: "orders.order.refund@1",
        output: { $ref: "#/schemas/orders.RefundOrderOutput" },
      },
      // Shapes whose names clash with a bound name and with each other.
      {
        ...list,
        key: "orders.order.pipeline@1",
        output: { $ref: "#/schemas/orders.ActionPipeline" },
      },
      {
        ...list,
        key: "orders.order.summary@1",
        input: { $ref: "#/schemas/orders.Summary" },
        output: { $ref: "#/schemas/billing.Summary" },
      },
    ] as NonNullable<StackraManifest["actions"]>,
  };
  const content = emitEncoreApi(ir, manifest)?.content ?? "";
  const endpoint = (
    entry: (typeof entries)[number] | undefined,
  ): { method: string; path: string } => entry?.["endpoint"] as { method: string; path: string };

  it("writes the endpoints file of a service, importing the pipeline, Encore, the helper and the server app", () => {
    expect(emitEncoreApi(ir, manifest)?.path).toBe("stackra-encore/commerce/api.ts");
    for (const line of [
      'import { ActionPipeline, requestCallOptions } from "@stackra/actions";',
      'import { api } from "encore.dev/api";',
      'import { CancelOrderAction } from "#modules/orders/actions/cancel-order.action";',
      'import { CancelOrderInput } from "#modules/orders/schemas/cancel-order-input.schema";',
      'import { answerCall } from "./http";',
      `import { app } from "${GENERATED_ENTRY}";`,
    ])
      expect(content).toContain(line);
    expect(content).not.toContain("~encore/auth");
    expect(content).not.toContain("getAuthData");
  });

  it("writes one raw adapter per action with the derived endpoint, answered by the one helper", () => {
    const { method, path } = endpoint(cancel);
    expect(content).toContain(
      [
        `/** ${method} ${path}: orders.order.cancel@1 through the action pipeline. */`,
        "export const ordersOrderCancelV1 = api.raw(",
        `  { method: "${method}", path: "${path}", expose: true, auth: false },`,
        "  (req, resp) =>",
        "    answerCall(req, resp, {",
        `      path: "${path}",`,
        "      anonymous: false,",
        "      action: CancelOrderAction,",
        "      input: CancelOrderInput,",
        "      execute: (container, input, actor, request, call) =>",
        "        new ActionPipeline(container).execute(CancelOrderAction, input as never, { actor, ...requestCallOptions(request), ...call }),",
        "    }),",
        ");",
      ].join("\n"),
    );
  });

  it("writes a query's adapter like an action's", () => {
    const { method, path } = endpoint(list);
    expect(method).toBe("GET");
    expect(content).toContain("export const ordersOrderListV1 = api.raw(");
    expect(content).toContain(`  { method: "GET", path: "${path}", expose: true, auth: false },`);
    expect(content).toContain(
      "        new ActionPipeline(container).execute(ListOrdersQuery, input as never, { actor, ...requestCallOptions(request), ...call }),",
    );
  });

  it("lets only an anonymous entry run without a credential; Encore auth is off for all", () => {
    expect(content).toContain("export const ordersHealthCheckV1 = api.raw(");
    expect(content.match(/anonymous: true/g)).toHaveLength(1);
    expect(content.match(/expose: true, auth: false/g)).toHaveLength(
      content.match(/= api\.raw\(/g)?.length ?? -1,
    );
    expect(content).not.toContain("auth: true");
  });

  it("writes no adapter for an entry without an endpoint or a hosted entry", () => {
    expect(content).not.toContain("CountOrdersQuery");
    expect(content).not.toContain("kitOrderCancelV1");
  });

  it("writes a hosted package's actions and controllers when the host imports its root module", () => {
    const kit = {
      member: "kit",
      package: "@acme/kit",
      modules: [{ key: "kit", class: "KitModule", file: "src/node/kit.module.ts", exports: [] }],
      services: [
        { class: "CancelOrderAction", from: "@acme/kit/node" },
        { class: "RoomController", from: "@acme/kit/node", path: "/realtime/room" },
      ],
    } as unknown as StackraManifest;
    const hosting: MemberIR = { ...ir, dependencies: [{ package: "@acme/kit", manifest: kit }] };
    const text = emitEncoreApi(hosting, manifest)?.content ?? "";
    for (const line of [
      'import { CancelOrderAction as CancelOrderAction2, RoomController } from "@acme/kit/node";',
      "export const kitOrderCancelV1 = api.raw(",
      "        new ActionPipeline(container).execute(CancelOrderAction2, input as never, { actor, ...requestCallOptions(request), ...call }),",
      "export const roomController = api.raw(",
      '  { method: "*", path: "/realtime/room", expose: true, auth: false },',
      "      execute: (container, _input, _actor, request) => container.get(RoomController).handle(request),",
    ])
      expect(text).toContain(line);
    // A hosted input class is not known, so its query string is not coerced.
    const hostedCancel = text.slice(text.indexOf("export const kitOrderCancelV1"));
    expect(hostedCancel.slice(0, hostedCancel.indexOf(");"))).not.toContain("input: ");
    const noRoot = { ...kit, modules: [{ key: "kit", class: "KitModule", exports: [] }] };
    const unhosted: MemberIR = {
      ...ir,
      dependencies: [{ package: "@acme/kit", manifest: noRoot as unknown as StackraManifest }],
    };
    expect(emitEncoreApi(unhosted, manifest)?.content).not.toContain("roomController");
  });

  it("writes a raw controller as a wildcard-method endpoint through the same helper", () => {
    const withController: MemberIR = {
      ...ir,
      classes: [
        ...ir.classes,
        {
          ...query("AuthCallbackController", "auth-callback", { path: "/api/auth/*" }),
          kind: "controller",
          file: "src/modules/orders/raw/auth-callback.controller.ts",
          importPath: "#modules/orders/raw/auth-callback.controller",
        },
      ],
    };
    const text = emitEncoreApi(withController, manifest)?.content ?? "";
    for (const line of [
      "export const authCallbackController = api.raw(",
      '  { method: "*", path: "/api/auth/*rest", expose: true, auth: false },',
      "      raw: true,",
      "      execute: (container, _input, _actor, request) => container.get(AuthCallbackController).handle(request),",
    ])
      expect(text).toContain(line);
    // A controller names no action, so serveGuardedCall never lets a forwarded token through it (ADR 0209).
    const controller = text.slice(text.indexOf("export const authCallbackController"));
    expect(controller).not.toContain("action:");
  });

  it("names each action's class to the helper, so a second hop is read from it", () => {
    expect(content.match(/^ {6}action: \w+,$/gm)).toHaveLength(
      content.match(/new ActionPipeline\(/g)?.length ?? -1,
    );
  });

  it("writes none for a package, an app or a service with no endpoint", () => {
    expect(emitEncoreApi({ ...ir, layout: "package" }, manifest)).toBeUndefined();
    expect(emitEncoreApi({ ...ir, layout: "app" }, manifest)).toBeUndefined();
    expect(emitEncoreApi(ir, { ...manifest, actions: [] })).toBeUndefined();
  });
});
