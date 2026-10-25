/**
 * Stackra file contract:
 * Purpose: unit tests of `fromBase64`: standard and URL-safe text, with or without padding.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { fromBase64 } from "#core/functions/from-base64.function";

describe("fromBase64", () => {
  it("decodes standard and URL-safe base64", () => {
    expect([...fromBase64("aGk=")]).toEqual([104, 105]);
    expect([...fromBase64("aGk")]).toEqual([104, 105]);
    expect([...fromBase64("-_8")]).toEqual([251, 255]);
  });
});
