/**
 * Stackra file contract:
 * Purpose: unit tests of `Link`: the id without a load, one load through the installed resolver, the error without
 *          one, JSON as the id, and no `unwrap()`.
 * Boundary: test only; installs a fake resolver and removes it after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 28).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Link } from "#core/values/link.value";

interface Variant {
  id: `var_${string}`;
  sku: string;
}

const ID = "var_01jab3k4m5n6p7q8r9s0t1v2w3";

afterEach(() => {
  Link.useResolver(undefined);
});

describe(Link, () => {
  it("knows the id without a load and serializes as it", () => {
    const link = new Link<Variant>("catalogue.variant", ID);
    expect(link.id).toBe(ID);
    expect(link.model).toBe("catalogue.variant");
    expect(link.isInitialized()).toBe(false);
    expect(JSON.stringify({ variant: link })).toBe(`{"variant":"${ID}"}`);
    expect("unwrap" in link).toBe(false);
  });

  it("loads once through the resolver", async () => {
    const resolve = vi.fn(async (model: string, id: string) => ({ id, sku: `${model}:SKU` }));
    Link.useResolver(resolve);
    const link = new Link<Variant>("catalogue.variant", ID);
    expect((await link.load()).sku).toBe("catalogue.variant:SKU");
    await link.load();
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve).toHaveBeenCalledWith("catalogue.variant", ID);
    expect(link.isInitialized()).toBe(true);
  });

  it("fails to load without a resolver", async () => {
    await expect(new Link<Variant>("catalogue.variant", ID).load()).rejects.toThrow(
      /No link resolver/,
    );
  });
});
