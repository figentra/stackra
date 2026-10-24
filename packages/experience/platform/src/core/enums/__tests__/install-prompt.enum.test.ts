/**
 * Stackra file contract:
 * Purpose: unit tests of `InstallPrompt`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { InstallPrompt } from "#core/enums/install-prompt.enum";

describe("InstallPrompt", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(InstallPrompt)).toEqual(["browser", "house", "never"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(InstallPrompt.Browser).toBe("browser");
    expectTypeOf(InstallPrompt.Browser).toEqualTypeOf<"browser">();
    expectTypeOf<InstallPrompt>().toEqualTypeOf<"browser" | "house" | "never">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(InstallPrompt)).toBe(true);
  });
});
