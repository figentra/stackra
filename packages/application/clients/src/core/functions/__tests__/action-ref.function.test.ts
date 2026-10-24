/**
 * Stackra file contract:
 * Purpose: unit and type tests of `actionRef`: the statics a generated action class carries (key, derived permission,
 *          schemas from a zod schema or a remote shape, route, risk, merged texts), its record by key, the refused
 *          key, and `ActionInput` over it.
 * Boundary: test only; the refs restate the template's generated `#stackra/clients/commerce` shapes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 3); ADR 0294 (decision 20).
 */
import { HttpMethod } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { publicId } from "@stackra/validation";
import { z } from "zod";

import { CALL_REFS } from "#core/constants/call-refs.constant";
import { actionRef } from "#core/functions/action-ref.function";
import { remoteShape } from "#core/functions/remote-shape.function";
import type { ActionInput } from "#core/types/action-input.type";
import type { RefOutput } from "#core/types/ref-output.type";

const ORDER_ID = "ord_01h2j3k4m5n6p7q8r9s0t1v2w3";
const CONFIRM = "orders::actions.order.cancel.confirm" as I18nKey;
const SUCCESS = "orders::actions.order.cancel.success" as I18nKey;

class CancelOrderInput extends remoteShape(
  "orders.CancelOrderInput",
  z.object({ orderId: publicId("ord") }),
) {}

class CancelOrderAction extends actionRef("orders.order.cancel@1", {
  input: CancelOrderInput,
  output: z.object({ orderId: publicId("ord"), status: z.enum(["paid", "cancelled"]) }),
  http: { method: HttpMethod.Put, path: "/orders/:orderId/cancel" },
  risk: "l2",
  confirm: CONFIRM,
  texts: { success: SUCCESS },
}) {}

class CreateOrderAction extends actionRef("orders.order.create@1", {
  input: z.object({
    lines: z.array(z.object({ variantId: publicId("var"), quantity: z.number().int() })),
    note: z.string().default(""),
  }),
  output: z.object({ orderId: publicId("ord") }),
}) {}

describe("actionRef", () => {
  it("carries the key, the derived permission and the route as statics", () => {
    expect(CancelOrderAction.kind).toBe("action");
    expect(CancelOrderAction.key).toBe("orders.order.cancel@1");
    expect(CancelOrderAction.permission).toBe("orders.order.cancel");
    expect(CancelOrderAction.endpoint).toEqual({ method: "PUT", path: "/orders/:orderId/cancel" });
    expect(CancelOrderAction.risk).toBe("l2");
  });

  it("reads a remote shape's schema and keeps a zod schema as it is", () => {
    expect(CancelOrderAction.input).toBe(CancelOrderInput.schema);
    expect(CancelOrderAction.output.parse({ orderId: ORDER_ID, status: "paid" })).toEqual({
      orderId: ORDER_ID,
      status: "paid",
    });
  });

  it("merges the short-form texts into texts", () => {
    expect(CancelOrderAction.texts).toEqual({ confirm: CONFIRM, success: SUCCESS });
    expect(CreateOrderAction.texts).toEqual({});
  });

  it("leaves an undeclared route and risk absent", () => {
    expect("endpoint" in CreateOrderAction).toBe(false);
    expect("risk" in CreateOrderAction).toBe(false);
  });

  it("records each ref by key for the mutation queue", () => {
    expect(CALL_REFS.get("orders.order.create@1")).toBe(Object.getPrototypeOf(CreateOrderAction));
  });

  it("refuses a key that is not a call key", () => {
    expect(() => actionRef("Orders.Cancel", { input: z.object({}), output: z.object({}) })).toThrow(
      RangeError,
    );
  });

  it("types the input on its input side and the answer on its output side", () => {
    // A field with a default may be left out on the input side.
    const input: ActionInput<typeof CreateOrderAction> = {
      lines: [{ variantId: "var_01h2j3k4m5n6p7q8r9s0t1v2w3", quantity: 1 }],
    };
    expectTypeOf(input.lines).toEqualTypeOf<{ variantId: string; quantity: number }[]>();
    expectTypeOf<RefOutput<typeof CancelOrderAction>["status"]>().toEqualTypeOf<
      "paid" | "cancelled"
    >();
  });
});
