/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: exactly `PostgresCacheDriver`, `ValkeyCacheDriver` and
 *          `postgresCacheTables`.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias, with the Valkey client mocked so no
 *           connection opens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as node from "#node/index";

vi.mock("iovalkey", () => ({ default: class {} }));

describe("@stackra/cache/node", () => {
  it("exports exactly the server drivers and the Postgres tables' statements", () => {
    expect(Object.keys(node).sort()).toEqual([
      "PostgresCacheDriver",
      "ValkeyCacheDriver",
      "postgresCacheTables",
    ]);
  });
});
