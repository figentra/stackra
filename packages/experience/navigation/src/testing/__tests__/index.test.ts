/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the template's `createRoutesStub` (React Router's own) and
 *          `runLoader`, with the extension point `registerRouteTestingPart`, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 6); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { createRoutesStub } from "react-router";

import * as testing from "#testing/index";

describe("@stackra/navigation/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "createRoutesStub",
      "registerRouteTestingPart",
      "runLoader",
    ]);
    expect(testing.createRoutesStub).toBe(createRoutesStub);
  });
});
