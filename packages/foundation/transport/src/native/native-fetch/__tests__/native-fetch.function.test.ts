/**
 * Stackra file contract:
 * Purpose: unit tests of `nativeFetch`: it hands `expo/fetch` the request's URL, method, headers and signal, the body
 *          as bytes only for a method that may carry one and only when there is one, and returns Expo's response.
 * Boundary: test only; `expo/fetch` does not load in vitest, so it is replaced by a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 4: `vi.mock` from @stackra/testing hoists).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { fetch as expoFetch } from "expo/fetch";

import { nativeFetch } from "#native/native-fetch/native-fetch.function";

vi.mock("expo/fetch", () => ({ fetch: vi.fn(async () => new Response("from expo")) }));

/** The init `expo/fetch` was last called with. */
function lastInit(): Record<string, unknown> {
  const call = vi.mocked(expoFetch).mock.calls.at(-1);
  return (call?.[1] ?? {}) as Record<string, unknown>;
}

describe("nativeFetch", () => {
  it("sends a GET with its URL, method, headers and signal and no body", async () => {
    const controller = new AbortController();
    const response = await nativeFetch(
      new Request("https://api.test/orders?page=2", {
        headers: { Authorization: "Bearer abc", "Stackra-Version": "2027-03-01" },
        signal: controller.signal,
      }),
    );
    expect(vi.mocked(expoFetch).mock.calls.at(-1)?.[0]).toBe("https://api.test/orders?page=2");
    const init = lastInit();
    expect(init["method"]).toBe("GET");
    expect(init["headers"]).toEqual({
      authorization: "Bearer abc",
      "stackra-version": "2027-03-01",
    });
    expect(init["signal"]).toBeInstanceOf(AbortSignal);
    expect("body" in init).toBe(false);
    expect(await response.text()).toBe("from expo");
  });

  it("sends a POST body as bytes", async () => {
    await nativeFetch(new Request("https://api.test/orders", { method: "POST", body: "payload" }));
    const init = lastInit();
    expect(init["method"]).toBe("POST");
    expect(new TextDecoder().decode(init["body"] as ArrayBuffer)).toBe("payload");
  });

  it("sends no body for a write without one", async () => {
    await nativeFetch(new Request("https://api.test/orders/1", { method: "DELETE" }));
    expect("body" in lastInit()).toBe(false);
  });
});
