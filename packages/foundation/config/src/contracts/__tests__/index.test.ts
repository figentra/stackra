/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports exactly the `SecretStore` port, and `.` no
 *          longer does (one symbol, one entry).
 * Boundary: test only; imports the stand-in barrels through their aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import * as core from "#core/index";

describe("@stackra/config/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts)).toEqual(["SecretStore"]);
  });

  it("is not exported from the core entry", () => {
    expect("SecretStore" in core).toBe(false);
  });
});
