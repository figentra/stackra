/**
 * Stackra file contract:
 * Purpose: unit tests of `PromptMoment`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PromptMoment } from "#core/enums/prompt-moment.enum";

describe("PromptMoment", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(PromptMoment)).toEqual(["first_session", "first_use", "settings"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(PromptMoment.FirstSession).toBe("first_session");
    expectTypeOf(PromptMoment.FirstSession).toEqualTypeOf<"first_session">();
    expectTypeOf<PromptMoment>().toEqualTypeOf<"first_session" | "first_use" | "settings">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(PromptMoment)).toBe(true);
  });
});
