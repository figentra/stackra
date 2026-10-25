/**
 * Stackra file contract:
 * Purpose: unit tests of `clientRequest`: the request a transport receives (key, kind, route, wire input with defaults
 *          applied and dates as ISO text, output schema, call options), and an invalid input refused with field errors.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 3); ADR 0140 (field errors).
 */
import { InputInvalidError } from "@stackra/actions";
import { HttpMethod } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { isoDateTime } from "@stackra/validation";
import { z } from "zod";

import { actionRef } from "#core/functions/action-ref.function";
import { clientRequest } from "#core/functions/client-request.function";
import { queryRef } from "#core/functions/query-ref.function";

const output = z.object({ orderId: z.string() });

class RescheduleOrderAction extends actionRef("orders.order.reschedule@1", {
  input: z.object({
    orderId: z.string(),
    at: isoDateTime(),
    lines: z.array(z.object({ quantity: z.number().int().min(1) })).min(1),
    note: z.string().default(""),
  }),
  output,
  http: { method: HttpMethod.Put, path: "/orders/:orderId/reschedule" },
}) {}

class PointsIssuedQuery extends queryRef("loyalty_kit.points.stats_today@1", {
  input: z.object({}),
  output: z.object({ earned: z.number() }),
}) {}

describe("clientRequest", () => {
  it("builds the request with the wire input and the call options", () => {
    const signal = new AbortController().signal;
    const request = clientRequest(
      RescheduleOrderAction,
      { orderId: "ord_1", at: new Date("2027-03-01T09:00:00.000Z"), lines: [{ quantity: 2 }] },
      { idempotencyKey: "step-1", signal },
    );
    expect(request).toEqual({
      key: "orders.order.reschedule@1",
      kind: "action",
      endpoint: { method: "PUT", path: "/orders/:orderId/reschedule" },
      input: {
        orderId: "ord_1",
        at: "2027-03-01T09:00:00.000Z",
        lines: [{ quantity: 2 }],
        note: "",
      },
      output,
      idempotencyKey: "step-1",
      signal,
    });
  });

  it("leaves the route and the options out when there are none", () => {
    const request = clientRequest(PointsIssuedQuery, {});
    expect(request).toEqual({
      key: "loyalty_kit.points.stats_today@1",
      kind: "query",
      input: {},
      output: PointsIssuedQuery.output,
    });
  });

  it("refuses an invalid input with one field error per path", () => {
    let thrown: unknown;
    try {
      clientRequest(RescheduleOrderAction, {
        orderId: "ord_1",
        at: "soon",
        lines: [{ quantity: 0 }],
      });
    } catch (error) {
      thrown = error;
    }
    expect(isRefusal(thrown, InputInvalidError)).toBe(true);
    expect(Object.keys((thrown as InputInvalidError).fieldErrors ?? {}).sort()).toEqual([
      "at",
      "lines.0.quantity",
    ]);
  });
});
