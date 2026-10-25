/**
 * Stackra file contract:
 * Purpose: unit tests of `deriveEndpoint`: every row of the endpoint convention, the override, `endpoint: false`, the
 *          actors rule and the public area prefix.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 21); ADR 0305 (rule 28); ADR 0082.
 */
import { describe, expect, it } from "@stackra/testing";

import { deriveEndpoint } from "#core/functions/derive-endpoint.function";

describe("deriveEndpoint", () => {
  it("maps the resource verbs", () => {
    expect(deriveEndpoint({ key: "order.list", kind: "query", inputFields: [] })).toEqual({
      method: "GET",
      path: "/orders",
      derived: true,
    });
    expect(
      deriveEndpoint({ key: "order.get", kind: "query", inputFields: ["orderId"] })?.path,
    ).toBe("/orders/:orderId");
    expect(deriveEndpoint({ key: "order.create", kind: "action", inputFields: [] })).toEqual({
      method: "POST",
      path: "/orders",
      derived: true,
    });
    expect(deriveEndpoint({ key: "order.update", kind: "action", inputFields: [] })).toEqual({
      method: "PATCH",
      path: "/orders/:orderId",
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
      path: "/orders/:orderId/cancel",
      derived: true,
    });
    expect(
      deriveEndpoint({ key: "order_line.attach_image", kind: "action", inputFields: [] }),
    ).toEqual({
      method: "POST",
      path: "/order-lines/attach-image",
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
});
