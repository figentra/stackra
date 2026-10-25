/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the Postgres driver and the unit-of-work driver are exported,
 *          nothing else is.
 * Boundary: test only; no database is connected.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15); ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/database/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "DatabaseUnitOfWorkDriver",
      "PostgresDatabaseDriver",
    ]);
  });
});
