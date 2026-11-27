/**
 * Stackra file contract:
 * Purpose: unit tests of `secretEntriesOf`: a JSON object gives its string members, any other text (a plain value, a
 *          JSON array, number or string, invalid JSON) is one secret under the stored secret's name.
 * Boundary: test only; every value is a made-up canary.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { secretEntriesOf } from "#core/functions/secret-entries-of.function";

describe(secretEntriesOf, () => {
  it("splits a JSON object into its string members", () => {
    expect(
      secretEntriesOf("app/prod", JSON.stringify({ A_KEY: "a-canary", COUNT: 3, NESTED: {} })),
    ).toEqual([["A_KEY", "a-canary"]]);
  });

  it("keeps any other text whole, under the stored secret's name", () => {
    for (const text of ["plain-canary", "[1,2]", "42", '"quoted"', "{not json"])
      expect(secretEntriesOf("API_KEY", text)).toEqual([["API_KEY", text]]);
  });
});
