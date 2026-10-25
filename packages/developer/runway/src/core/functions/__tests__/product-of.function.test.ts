/**
 * Stackra file contract:
 * Purpose: unit tests of `productOf`: the product and an edition's base come from the injected facts; `null` when the
 *          facts carry no product; facts that break the product shape fail.
 * Boundary: test only; the facts are injected through `__STACKRA_RUNWAY__`, as a bundle carries them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0335 (decision 2).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { productOf } from "#core/functions/product-of.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("productOf", () => {
  it("returns an edition with its base and version range", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      product: { key: "muslin", edition: { of: "commerce", version: "^1.0.0" } },
      members: {},
    });

    expect(productOf()).toEqual({ key: "muslin", edition: { of: "commerce", version: "^1.0.0" } });
  });

  it("returns a base product with no edition, and null with no product", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", { version: 1, product: { key: "commerce" }, members: {} });
    expect(productOf()).toEqual({ key: "commerce" });

    vi.stubGlobal("__STACKRA_RUNWAY__", { version: 1, members: {} });
    expect(productOf()).toBeNull();
  });

  it("refuses a product that breaks its shape", () => {
    vi.stubGlobal("__STACKRA_RUNWAY__", { version: 1, product: { key: "Muslin" }, members: {} });

    expect(() => productOf()).toThrow(RunwayInvalidError);
  });
});
