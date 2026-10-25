/**
 * Stackra file contract:
 * Purpose: unit tests of `ShowSecondScreenBridge`: a bridge keyed `screen.second` of the `window` capability that
 *          opens a route of the app on the second screen or closes it for `null`, and refuses another origin, a
 *          protocol-relative path or an over-long route before touching the port.
 * Boundary: test only; the port is the memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0251 (decisions 1 to 3); ADR 0339 (open question 3).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { MemorySecondScreenDriver } from "#core/drivers/memory-second-screen.driver";
import { ShowSecondScreenBridge } from "#desktop/bridges/show-second-screen.bridge";
import type { ShowSecondScreenInput } from "#desktop/types/show-second-screen-input.type";

describe("ShowSecondScreenBridge", () => {
  it("is the platform.screen.second bridge of the window capability", () => {
    expect(kindOf(ShowSecondScreenBridge)).toEqual({
      kind: "bridge",
      options: { key: "screen.second", capability: "window" },
    });
  });

  it("opens a route and closes on null", async () => {
    const screen = new MemorySecondScreenDriver();
    const bridge = new ShowSecondScreenBridge(screen);
    expect(await bridge.handle({ route: "/customer-display" })).toEqual({
      ok: true,
      data: undefined,
    });
    expect(screen.route).toBe("/customer-display");
    await bridge.handle({ route: null });
    expect(screen.route).toBeNull();
  });

  it("refuses what is not a path of the app", async () => {
    const screen = new MemorySecondScreenDriver();
    const bridge = new ShowSecondScreenBridge(screen);
    for (const route of [
      undefined,
      1,
      "https://evil.example",
      "//evil.example",
      "/a b",
      `/${"x".repeat(256)}`,
    ])
      await expect(bridge.handle({ route } as unknown as ShowSecondScreenInput)).rejects.toThrow(
        TypeError,
      );
    expect(screen.route).toBeNull();
  });
});
