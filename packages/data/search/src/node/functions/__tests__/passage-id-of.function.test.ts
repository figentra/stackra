/**
 * Stackra file contract:
 * Purpose: unit test of `passageIdOf`: the class name, a colon and the primary key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0160.
 */
import { describe, expect, it } from "@stackra/testing";

import { passageIdOf } from "#node/functions/passage-id-of.function";

class CaseNote {}

describe(passageIdOf, () => {
  it("prefixes the primary key with the model's class name", () => {
    expect(passageIdOf(CaseNote, "cnt_1")).toBe("CaseNote:cnt_1");
  });
});
