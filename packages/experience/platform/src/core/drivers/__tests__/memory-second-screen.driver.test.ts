/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySecondScreenDriver`: it opens and closes a route, refuses on `window` with no display,
 *          and throws for a route that is not a path of the app.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339 (open question 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemorySecondScreenDriver } from "#core/drivers/memory-second-screen.driver";

describe("MemorySecondScreenDriver", () => {
  it("opens and closes a route", async () => {
    const screen = new MemorySecondScreenDriver();
    expect(await screen.open("/customer-display")).toEqual({ ok: true, data: undefined });
    expect(screen.route).toBe("/customer-display");
    await screen.close();
    expect(screen.route).toBeNull();
  });

  it("refuses with no display and throws for another origin", async () => {
    const screen = new MemorySecondScreenDriver();
    screen.hasDisplay = false;
    const refused = { ok: false, error: { code: "unavailable", capability: "window" } };
    expect(await screen.probe()).toEqual(refused);
    expect(await screen.open("/customer-display")).toEqual(refused);
    await expect(screen.open("https://evil.example")).rejects.toThrow(TypeError);
    await expect(screen.open("//evil.example")).rejects.toThrow(TypeError);
  });
});
