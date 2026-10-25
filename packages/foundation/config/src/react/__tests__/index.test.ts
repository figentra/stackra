/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `useConfig`, the one symbol the template imports from
 *          `@stackra/config/react`, is exported, and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/config/react", () => {
  it("exports exactly useConfig", () => {
    expect(Object.keys(react)).toEqual(["useConfig"]);
    expect(react.useConfig).toBeTypeOf("function");
  });
});
