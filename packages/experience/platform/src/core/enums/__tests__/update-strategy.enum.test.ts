/**
 * Stackra file contract:
 * Purpose: unit tests of `UpdateStrategy`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { UpdateStrategy } from "#core/enums/update-strategy.enum";

describe("UpdateStrategy", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(UpdateStrategy)).toEqual(["prompt", "auto"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(UpdateStrategy.Prompt).toBe("prompt");
    expectTypeOf(UpdateStrategy.Prompt).toEqualTypeOf<"prompt">();
    expectTypeOf<UpdateStrategy>().toEqualTypeOf<"prompt" | "auto">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(UpdateStrategy)).toBe(true);
  });
});
