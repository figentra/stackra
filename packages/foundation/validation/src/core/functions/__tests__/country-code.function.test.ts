/**
 * Stackra file contract:
 * Purpose: unit tests of `countryCode`: known regions pass upper-cased, unknown ones are refused, and the module still
 *          loads where the host has no `Intl.DisplayNames` (Hermes on React Native).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ISO 3166-1; ADR 0305.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

describe("countryCode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("upper-cases known regions and refuses unknown codes", async () => {
    const { countryCode } = await import("#core/functions/country-code.function");
    expect(countryCode().parse(" sa ")).toBe("SA");
    expect(countryCode().safeParse("AB").success).toBe(false);
    expect(countryCode().safeParse("SAU").success).toBe(false);
  });

  it("loads and checks the shape only when Intl.DisplayNames is missing", async () => {
    vi.stubGlobal("Intl", { ...Intl, DisplayNames: undefined });
    vi.resetModules();
    const { countryCode } = await import("#core/functions/country-code.function");
    expect(countryCode().parse("eg")).toBe("EG");
    expect(countryCode().safeParse("E1").success).toBe(false);
  });
});
