/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the template imports `useFlag` from it (its pricing table and
 *          its generated mobile navigation), and nothing else is exported.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/feature-flags/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual(["useFlag"]);
  });
});
