/**
 * Stackra file contract:
 * Purpose: unit tests of `seed`: it posts `{ key }` as JSON to the stack's seed control path, and a refusal throws with
 *          the key and the status.
 * Boundary: test only; `@playwright/test` is mocked to a project `baseURL` and `fetch` is replaced, so no stack runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6); ADR 0182 (decision 2: coverage floors).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { seed } from "#e2e/seed/seed.function";

vi.mock("@playwright/test", () => ({
  test: { info: () => ({ project: { use: { baseURL: "http://localhost:5174" } } }) },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("seed", () => {
  it("posts the seeder key to the seed control path", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    await seed("orders.demo");
    expect(fetch).toHaveBeenCalledWith("http://localhost:5174/__stackra/e2e/seed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "orders.demo" }),
    });
  });

  it("throws with the key and the status when the stack refuses", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 404 }));
    await expect(seed("orders.missing")).rejects.toThrow(
      'seed("orders.missing") failed: the e2e stack answered 404',
    );
  });
});
