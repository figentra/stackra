/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: the template imports `runShortcut`, other packages' testing
 *          setups call `registerShortcutTestingPart`, and nothing else is exported.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as testing from "#testing/index";

describe("@stackra/shortcuts/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual(["registerShortcutTestingPart", "runShortcut"]);
  });
});
