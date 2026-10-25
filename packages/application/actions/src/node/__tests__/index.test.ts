/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: it exports exactly the `AsyncLocalStorage` context driver.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/actions/node", () => {
  it("exports exactly its driver", () => {
    expect(Object.keys(node)).toEqual(["AsyncContextStorageDriver"]);
  });
});
