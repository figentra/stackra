// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the route helpers `renderRoute`, `renderLayout`,
 *          `runRouteLoader`, `runRouteSubmit` and `routeMeta`, the extension point `registerRouteTestingPart`, React
 *          Router's own `createRoutesStub`, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest, jsdom)
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
      "renderLayout",
      "renderRoute",
      "routeMeta",
      "runRouteLoader",
      "runRouteSubmit",
    ]);
    expect(testing.createRoutesStub).toBe(createRoutesStub);
  });
});
