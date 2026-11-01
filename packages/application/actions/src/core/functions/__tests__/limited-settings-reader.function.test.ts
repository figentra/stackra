/**
 * Stackra file contract:
 * Purpose: unit tests of `limitedSettingsReader`: a listed key reaches the source, any other key throws before the
 *          source is called, and a source rejection propagates.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509; STA-1724 (P-002).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { limitedSettingsReader } from "#core/functions/limited-settings-reader.function";

describe(limitedSettingsReader, () => {
  it("forwards a listed key to the source", async () => {
    const source = vi.fn(async (key: string) => `value of ${key}`);
    const reader = limitedSettingsReader(["a.one", "a.two"], source);
    await expect(reader.get("a.two")).resolves.toBe("value of a.two");
    expect(source).toHaveBeenCalledWith("a.two");
  });

  it("throws on a key that is not listed, without calling the source", async () => {
    const source = vi.fn(async () => 1);
    const reader = limitedSettingsReader(["a.one"], source);
    await expect(reader.get("b.other")).rejects.toThrow(RangeError);
    expect(source).not.toHaveBeenCalled();
  });

  it("lets a source failure through, so a condition that cannot read fails the call", async () => {
    const reader = limitedSettingsReader(["a.one"], async () => {
      throw new Error("settings down");
    });
    await expect(reader.get("a.one")).rejects.toThrow("settings down");
  });
});
