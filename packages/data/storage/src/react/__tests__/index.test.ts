/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: it exports `usePrefs` (the template's settings hook imports
 *          it) and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/storage/react", () => {
  it("exports exactly usePrefs", () => {
    expect(Object.keys(react)).toEqual(["usePrefs"]);
  });
});
