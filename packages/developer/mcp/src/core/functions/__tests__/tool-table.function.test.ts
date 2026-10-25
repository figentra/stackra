/**
 * Stackra file contract:
 * Purpose: unit tests of `toolTable`: one row per manifest action with a `tool` entry, sorted by name; the input
 *          schema inlined from the same manifest and from a hosted package's manifest; gen's hints as annotations;
 *          an action without a tool entry left out; a name listed twice kept once.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0155 (decisions 1 and 4); ADR 0099 (decision 3).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { toolTable } from "#core/functions/tool-table.function";

const LOYALTY: StackraManifest = {
  member: "loyalty_kit",
  package: "@acme/loyalty-kit",
  version: "0.4.0",
  actions: [
    {
      key: "loyalty_kit.loyalty_account.redeem@1",
      kind: "action",
      module: "loyalty_kit",
      class: "RedeemPointsAction",
      permission: "loyalty_kit.loyalty_account.redeem",
      risk: "L2",
      tool: {
        name: "loyalty_kit_loyalty_account_redeem",
        default: true,
        hints: { readOnlyHint: false },
      },
      input: { $ref: "#/schemas/loyalty_kit.RedeemPointsInput" },
    },
  ],
  schemas: {
    "loyalty_kit.RedeemPointsInput": {
      type: "object",
      properties: { points: { type: "integer" } },
    },
  },
};

const COMMERCE: StackraManifest = {
  member: "commerce",
  package: "@figentra/service-commerce",
  version: "1.0.0",
  actions: [
    {
      key: "orders.order.list@1",
      kind: "query",
      module: "orders",
      class: "ListOrdersQuery",
      permission: "orders.order.read",
      risk: "L0",
      tool: {
        name: "orders_order_list",
        default: true,
        hints: { readOnlyHint: true, idempotentHint: true },
      },
    },
    {
      key: "orders.order.cancel@1",
      kind: "action",
      module: "orders",
      class: "CancelOrderAction",
      permission: "orders.order.cancel",
      risk: "L2",
      effects: ["financial"],
      description: "Cancel an order",
      tool: { name: "orders_order_cancel", default: true, hints: { destructiveHint: false } },
      input: { $ref: "#/schemas/orders.CancelOrderInput" },
    },
    {
      key: "orders.order.sync@1",
      kind: "action",
      module: "orders",
      class: "SyncOrdersAction",
      permission: "orders.order.sync",
      risk: "L1",
    },
    {
      key: "loyalty_kit.loyalty_account.redeem@1",
      kind: "action",
      module: "loyalty_kit",
      class: "RedeemPointsAction",
      permission: "loyalty_kit.loyalty_account.redeem",
      risk: "L2",
      from: "@acme/loyalty-kit",
      tool: {
        name: "loyalty_kit_loyalty_account_redeem",
        default: true,
        hints: { readOnlyHint: false },
      },
      input: { $ref: "@acme/loyalty-kit#/schemas/loyalty_kit.RedeemPointsInput" },
    },
  ],
  schemas: {
    "orders.CancelOrderInput": {
      type: "object",
      properties: {
        orderId: { type: "string" },
        reason: { $ref: "#/schemas/orders.CancelReason" },
      },
    },
    "orders.CancelReason": { type: "string", enum: ["customer", "stock"] },
  },
};

describe("toolTable", () => {
  const tools = toolTable([COMMERCE, LOYALTY]);

  it("lists each tool once, sorted, and leaves out actions without a tool entry", () => {
    expect(tools.map((tool) => tool.name)).toEqual([
      "loyalty_kit_loyalty_account_redeem",
      "orders_order_cancel",
      "orders_order_list",
    ]);
  });

  it("inlines the input schema, nested refs included", () => {
    const cancel = tools.find((tool) => tool.name === "orders_order_cancel");
    expect(cancel).toMatchObject({
      description: "Cancel an order",
      action: "orders.order.cancel@1",
      member: "commerce",
      permission: "orders.order.cancel",
      risk: "L2",
      effects: ["financial"],
      annotations: { destructiveHint: false },
      inputSchema: {
        type: "object",
        properties: {
          orderId: { type: "string" },
          reason: { type: "string", enum: ["customer", "stock"] },
        },
      },
    });
  });

  it("reads a rehomed ref from the hosted package's manifest", () => {
    expect(
      tools.find((tool) => tool.name === "loyalty_kit_loyalty_account_redeem")?.inputSchema,
    ).toEqual({
      type: "object",
      properties: { points: { type: "integer" } },
    });
  });

  it("gives a tool without input an empty object schema", () => {
    expect(tools.find((tool) => tool.name === "orders_order_list")?.inputSchema).toEqual({
      type: "object",
      properties: {},
    });
  });
});
