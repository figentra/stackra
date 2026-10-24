/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./worker` entry: `forwardedFacts`, which the template's generated
 *          `clients.server.ts` imports, is exported and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#worker` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as worker from "#worker/index";

describe("@stackra/clients/worker", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(worker).sort()).toEqual(["forwardedFacts"]);
  });
});
