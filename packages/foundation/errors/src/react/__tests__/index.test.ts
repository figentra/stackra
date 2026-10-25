/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: it exports `useErrorReporter` (the console's error state
 *          imports it) and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/errors/react", () => {
  it("exports exactly useErrorReporter", () => {
    expect(Object.keys(react)).toEqual(["useErrorReporter"]);
  });
});
