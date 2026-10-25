/**
 * Stackra file contract:
 * Purpose: unit tests of `memberId`: the value passes through unchanged and is typed as a `MemberId`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0135.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { MemberId } from "#contracts/types/member-id.type";
import { memberId } from "#core/functions/member-id.function";

describe("memberId", () => {
  it("brands a principal id without changing it", () => {
    const member = memberId("usr_1");
    expect(member).toBe("usr_1");
    expectTypeOf(member).toEqualTypeOf<MemberId>();
  });
});
