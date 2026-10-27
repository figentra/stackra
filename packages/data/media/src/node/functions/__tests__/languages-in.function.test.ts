/**
 * Stackra file contract:
 * Purpose: unit tests of `languagesIn`: a hint stays when its likely script is in the text, in the hints' order; a
 *          hint with no known script, or a malformed one, stays.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0192.
 */
import { describe, expect, it } from "@stackra/testing";

import { languagesIn } from "#node/functions/languages-in.function";

describe("languagesIn", () => {
  it("keeps the hints whose script is in the text", () => {
    expect(languagesIn("العقد — The contract", ["ar", "en", "ru"])).toEqual(["ar", "en"]);
    expect(languagesIn("The contract", ["ar", "en"])).toEqual(["en"]);
    expect(languagesIn("合同", ["zh", "en"])).toEqual(["zh"]);
  });

  it("finds nothing in empty text", () => {
    expect(languagesIn("", ["ar", "en"])).toEqual([]);
  });

  it("keeps a malformed hint rather than guessing", () => {
    expect(languagesIn("x", ["not a tag!"])).toEqual(["not a tag!"]);
  });
});
