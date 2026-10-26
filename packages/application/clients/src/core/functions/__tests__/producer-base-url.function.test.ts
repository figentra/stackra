/**
 * Stackra file contract:
 * Purpose: unit tests of `producerBaseUrl`: a listed module's URL wins, any other key (and an inherited object
 *          property name) falls back to the API base URL.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (the 2026-10-26 note on dynamic keys).
 */
import { describe, expect, it } from "@stackra/testing";

import { producerBaseUrl } from "#core/functions/producer-base-url.function";

const options = {
  baseUrl: "https://api.acme.example",
  producers: { orders: "https://orders.internal" },
};

describe("producerBaseUrl", () => {
  it("picks the URL of the key's module", () => {
    expect(producerBaseUrl("orders.order.cancel@1", options)).toBe("https://orders.internal");
  });

  it("falls back to the base URL for a module not listed", () => {
    expect(producerBaseUrl("billing.invoice.list@1", options)).toBe("https://api.acme.example");
    expect(producerBaseUrl("constructor.x.y@1", options)).toBe("https://api.acme.example");
    expect(producerBaseUrl("orders", options)).toBe("https://orders.internal");
  });
});
