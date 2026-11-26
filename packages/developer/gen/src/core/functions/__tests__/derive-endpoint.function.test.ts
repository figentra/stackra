/**
 * Stackra file contract:
 * Purpose: unit tests of `deriveEndpoint`: every row of the endpoint convention, the override, `endpoint: false`, the
 *          actors rule, and the area prefix of every area with `app` as the default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 21); ADR 0305 (rule 28); ADR 0082; ADR 0237
 *                     (decision 1); STA-340.
 */
import { describe, expect, it } from "@stackra/testing";

import { deriveEndpoint } from "#core/functions/derive-endpoint.function";

describe("deriveEndpoint", () => {
  it("maps the resource verbs", () => {
    expect(deriveEndpoint({ key: "order.list", kind: "query", inputFields: [] })).toEqual({
      method: "GET",
      path: "/app/orders",
      derived: true,
    });
    expect(
      deriveEndpoint({ key: "order.get", kind: "query", inputFields: ["orderId"] })?.path,
    ).toBe("/app/orders/:orderId");
    expect(deriveEndpoint({ key: "order.create", kind: "action", inputFields: [] })).toEqual({
      method: "POST",
      path: "/app/orders",
      derived: true,
    });
    expect(deriveEndpoint({ key: "order.update", kind: "action", inputFields: [] })).toEqual({
      method: "PATCH",
      path: "/app/orders/:orderId",
      derived: true,
    });
    expect(deriveEndpoint({ key: "order.delete", kind: "action", inputFields: [] })?.method).toBe(
      "DELETE",
    );
  });

  it("maps other verbs by whether the input carries the id", () => {
    expect(
      deriveEndpoint({ key: "order.cancel", kind: "action", inputFields: ["orderId"] }),
    ).toEqual({
      method: "PUT",
      path: "/app/orders/:orderId/cancel",
      derived: true,
    });
    expect(
      deriveEndpoint({ key: "order_line.attach_image", kind: "action", inputFields: [] }),
    ).toEqual({
      method: "POST",
      path: "/app/order-lines/attach-image",
      derived: true,
    });
    expect(
      deriveEndpoint({ key: "product.search", kind: "query", inputFields: [], area: "public" }),
    ).toEqual({
      method: "GET",
      path: "/public/products/search",
      derived: true,
    });
  });

  // @covers sta-340:FR-001
  it("prefixes every area, and `app` when none is written", () => {
    for (const area of ["public", "app", "admin", "platform"])
      expect(
        deriveEndpoint({ key: "order.cancel", kind: "action", inputFields: ["orderId"], area })
          ?.path,
      ).toBe(`/${area}/orders/:orderId/cancel`);
    expect(
      deriveEndpoint({ key: "order.cancel", kind: "action", inputFields: ["orderId"] })?.path,
    ).toBe("/app/orders/:orderId/cancel");
  });

  it("honours the override, `endpoint: false` and the actors", () => {
    expect(
      deriveEndpoint({
        key: "order.cancel",
        kind: "action",
        inputFields: [],
        endpoint: { method: "post", path: "/x" },
      }),
    ).toEqual({ method: "POST", path: "/x", derived: false });
    expect(
      deriveEndpoint({ key: "order.cancel", kind: "action", inputFields: [], endpoint: false }),
    ).toBeUndefined();
    expect(
      deriveEndpoint({ key: "order.expire", kind: "action", inputFields: [], actors: ["system"] }),
    ).toBeUndefined();
    expect(
      deriveEndpoint({
        key: "order.expire",
        kind: "action",
        inputFields: [],
        actors: ["system", "agent"],
      }),
    ).toBeDefined();
  });

  it("routes an API-key caller, derived or written, and still none for a service alone", () => {
    expect(
      deriveEndpoint({
        key: "usage_event.record_batch",
        kind: "action",
        inputFields: [],
        actors: ["api_client", "service"],
        area: "public",
      }),
    ).toEqual({ method: "POST", path: "/public/usage-events/record-batch", derived: true });
    expect(
      deriveEndpoint({
        key: "usage_event.record_batch",
        kind: "action",
        inputFields: [],
        actors: ["api_client"],
        area: "public",
        endpoint: { method: "post", path: "/public/usage" },
      }),
    ).toEqual({ method: "POST", path: "/public/usage", derived: false });
    expect(
      deriveEndpoint({
        key: "usage_event.record_batch",
        kind: "action",
        inputFields: [],
        actors: ["service"],
      }),
    ).toBeUndefined();
  });

  it("routes an anonymous-only call, which the emitter answers with auth: false", () => {
    expect(
      deriveEndpoint({
        key: "checkout_page.load",
        kind: "query",
        inputFields: [],
        actors: ["anonymous"],
      }),
    ).toEqual({ method: "GET", path: "/app/checkout-pages/load", derived: true });
  });
});
