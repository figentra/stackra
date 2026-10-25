/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `PostgresLockDriver` and `ValkeyLockDriver` (the `postgres` and
 *          `valkey` drivers of `locking.driver`) are its values.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/locking/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual(["PostgresLockDriver", "ValkeyLockDriver"]);
  });
});
