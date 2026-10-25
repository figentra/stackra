/**
 * Stackra file contract:
 * Purpose: unit tests of `Changefreq`: its codes in source order (the sitemap protocol's words), a case read by name,
 *          the type of one code, and the frozen object.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Changefreq } from "#core/enums/changefreq.enum";

describe("Changefreq", () => {
  it("lists the protocol's words in source order", () => {
    expect(Enum.values(Changefreq)).toEqual([
      "always",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "never",
    ]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(Changefreq.Weekly).toBe("weekly");
    expectTypeOf(Changefreq.Daily).toEqualTypeOf<"daily">();
    expectTypeOf<Changefreq>().toEqualTypeOf<
      "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
    >();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(Changefreq)).toBe(true);
  });
});
