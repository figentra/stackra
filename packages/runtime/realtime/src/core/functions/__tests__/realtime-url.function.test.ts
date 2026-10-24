/**
 * Stackra file contract:
 * Purpose: unit tests of `realtimeUrl`: the realtime path and the encoded token on the configured origin, `wss:` or
 *          `ws:` for a socket and the origin's own scheme for the stream, the page origin when none is set, and a
 *          clear throw when neither exists.
 * Boundary: test only; `location` is stubbed on the global.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0225 (decision 1).
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { realtimeUrl } from "#core/functions/realtime-url.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("realtimeUrl", () => {
  it("builds the socket and stream URLs on the configured origin", () => {
    const target = { origin: "https://api.acme.example", token: "a b&c" };
    expect(realtimeUrl(target, "ws")).toBe("wss://api.acme.example/realtime?token=a+b%26c");
    expect(realtimeUrl(target, "http")).toBe("https://api.acme.example/realtime?token=a+b%26c");
    expect(realtimeUrl({ origin: "http://localhost:4000", token: "t" }, "ws")).toBe(
      "ws://localhost:4000/realtime?token=t",
    );
  });

  it("uses the page origin when the origin is empty", () => {
    vi.stubGlobal("location", { origin: "https://console.acme.example" });
    expect(realtimeUrl({ origin: "", token: "t" }, "ws")).toBe(
      "wss://console.acme.example/realtime?token=t",
    );
  });

  it("throws when there is no origin at all", () => {
    vi.stubGlobal("location", undefined);
    expect(() => realtimeUrl({ origin: "", token: "t" }, "http")).toThrow(TypeError);
  });
});
