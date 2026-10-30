/**
 * Stackra file contract:
 * Purpose: unit tests of `clientToolsOf`: a route gives `navigate.<route>` over its path params (`ai: false` opts out),
 *          a recorded resource gives its list, filter, sort, select, view and record tools and a prefill per placed
 *          action that is a tool, theming and anchors give their tools, and the four refusals fire.
 * Boundary: test only; runs on the web app IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0490 (decisions 1, 2, 5 and 16); STA-1631.
 */
import { describe, expect, it } from "@stackra/testing";

import { clientToolsOf } from "#core/functions/client-tools-of.function";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";
import type { MemberIR } from "#core/types/member-ir.type";

const keys = (ir: MemberIR): string[] => clientToolsOf(ir).tools.map((tool) => tool.key);

const orders = {
  package: "@acme/orders",
  manifest: {
    member: "orders",
    package: "@acme/orders",
    version: "0.1.0",
    actions: [
      {
        key: "orders.order.cancel@1",
        kind: "action",
        module: "orders",
        class: "CancelOrderAction",
        permission: "orders.order.cancel",
        risk: "L2",
        tool: { name: "orders_order_cancel" },
      },
      {
        key: "orders.order.purge@1",
        kind: "action",
        module: "orders",
        class: "PurgeOrderAction",
        permission: "orders.order.purge",
        risk: "L3",
        toolOff: "never an agent",
      },
    ],
    ui: {
      resources: {
        "orders.order": {
          table: { columns: [{ key: "placedAt" }], filters: [{ key: "status" }] },
          actions: [
            { kind: "run", action: { $class: "CancelOrderAction" } },
            { kind: "run", action: { $class: "PurgeOrderAction" } },
          ],
        },
      },
    },
  },
} as never;

const route = (name: string, options: Record<string, unknown>) => ({
  ...(WEB_APP_IR.classes.find((declared) => declared.kind === "route") as never as object),
  name,
  options,
});

describe("clientToolsOf", () => {
  it("gives each route a navigate tool over its path params, and honours ai: false", () => {
    const { tools } = clientToolsOf(WEB_APP_IR);
    expect(tools.map((tool) => tool.key)).toEqual(["navigate.order_detail", "navigate.settings"]);
    expect(tools[0]).toMatchObject({
      kind: "navigate",
      target: "order_detail",
      module: "web",
      inputSchema: { required: ["orderId"] },
    });
    const off = {
      ...WEB_APP_IR,
      classes: WEB_APP_IR.classes.map((declared) =>
        declared.kind === "route"
          ? { ...declared, options: { ...declared.options, ai: false } }
          : declared,
      ),
    };
    expect(keys(off)).toEqual([]);
  });

  it("derives the resource tools and a prefill per placed tool action", () => {
    const result = clientToolsOf({ ...WEB_APP_IR, classes: [], dependencies: [orders] });
    expect(result.errors).toEqual([]);
    expect(result.tools.map((tool) => tool.key)).toEqual([
      "orders.order.cancel.prefill",
      "orders.order.list.filter",
      "orders.order.list.open",
      "orders.order.list.select",
      "orders.order.list.sort",
      "orders.order.record.open",
      "orders.order.view.apply",
    ]);
    expect(result.tools.find((tool) => tool.kind === "filter")?.permission).toBe(
      "orders.order.read",
    );
  });

  it("refuses ai: true on a placement of a tool: false action", () => {
    const forced = structuredClone(orders) as never as {
      manifest: { ui: { resources: Record<string, { actions: Record<string, unknown>[] }> } };
    };
    forced.manifest.ui.resources["orders.order"].actions[1].ai = true;
    expect(
      clientToolsOf({ ...WEB_APP_IR, classes: [], dependencies: [forced] }).errors.map(
        (error) => error.code,
      ),
    ).toEqual(["prefill_tool_off"]);
  });

  it("writes ui.point for declared anchors and refuses an undeclared reference", () => {
    const ir: MemberIR = {
      ...WEB_APP_IR,
      classes: [],
      anchors: [{ file: "a.tsx", line: 1, column: 1, key: "orders.export" }],
      anchorReferences: [{ file: "t.ts", line: 2, column: 3, key: "gone" }],
    };
    const result = clientToolsOf(ir);
    expect(result.tools.map((tool) => tool.key)).toEqual(["ui.point"]);
    expect(result.errors).toMatchObject([
      { code: "anchor_undeclared", file: "t.ts", line: 2, column: 3 },
    ]);
  });

  it("refuses a record param that is not a public id, and two tools with one name", () => {
    const bad = clientToolsOf({
      ...WEB_APP_IR,
      classes: [
        route("OrderDetailRoute", {
          path: "/orders/:orderId",
          context: { record: { model: "orders.order", param: "orderId" } },
        }) as never,
      ],
    });
    expect(bad.errors.map((error) => error.code)).toEqual(["context_record_not_public_id"]);
    const twin = WEB_APP_IR.classes.find((declared) => declared.kind === "route") as never;
    expect(
      clientToolsOf({ ...WEB_APP_IR, classes: [twin, twin] }).errors.map((error) => error.code),
    ).toEqual(["client_tool_collision"]);
  });

  it("has no tools outside an app", () => {
    expect(clientToolsOf({ ...WEB_APP_IR, layout: "service" })).toEqual({ tools: [], errors: [] });
  });
});
