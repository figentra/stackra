/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the `ConnectionContext` port is exported, nothing else is,
 *          and `.` no longer exports it.
 * Boundary: test only; imports the stand-in barrels through their `#contracts` and `#core` aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import * as core from "#core/index";

describe("@stackra/integrations/contracts", () => {
  it("exports exactly its port", () => {
    expect(Object.keys(contracts).sort()).toEqual(["ConnectionContext"]);
  });

  it("is the only entry that exports the port", () => {
    expect("ConnectionContext" in core).toBe(false);
  });
});
