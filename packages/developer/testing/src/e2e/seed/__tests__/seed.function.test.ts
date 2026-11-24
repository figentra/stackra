/**
 * Stackra file contract:
 * Purpose: unit tests of `seed`: the key is posted as JSON to the seed endpoint of the e2e stack, and a non-2xx answer throws with the key
 *          and the status.
 * Boundary: test only; `fetch` and the project baseURL are stubs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { seed } from "#e2e/seed/seed.function";

const { info } = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("@playwright/test", () => ({ test: { info } }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("seed", () => {
  it("posts the key as JSON to the seed endpoint", async () => {
    info.mockReturnValue({ project: { use: { baseURL: "http://127.0.0.1:3710" } } });
    const fetchStub = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchStub);
    await seed("orders.demo");
    expect(fetchStub).toHaveBeenCalledWith("http://127.0.0.1:3710/__stackra/e2e/seed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: "orders.demo" }),
    });
  });

  it("throws, naming the key and the status, when the stack does not answer 2xx", async () => {
    info.mockReturnValue({ project: { use: { baseURL: "http://127.0.0.1:3710" } } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 })),
    );
    await expect(seed("orders.demo")).rejects.toThrow(
      'seed("orders.demo") failed: the e2e stack answered 500',
    );
  });
});
