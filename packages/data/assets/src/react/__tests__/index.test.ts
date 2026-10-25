/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: it exports `useAsset` (the template's public layout imports
 *          it) and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/assets/react", () => {
  it("exports exactly useAsset", () => {
    expect(Object.keys(react)).toEqual(["useAsset"]);
  });
});
