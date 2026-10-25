/**
 * Stackra file contract:
 * Purpose: unit tests of `PurgeAccessLogOutput`: a registered shape whose `deleted` is a whole number from 0, built
 *          with `create`, which refuses anything else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { PurgeAccessLogOutput } from "#node/schemas/purge-access-log-output.schema";

describe("PurgeAccessLogOutput", () => {
  it("holds how many records a run deleted", () => {
    const output = PurgeAccessLogOutput.create({ deleted: 0 });
    expect(output).toBeInstanceOf(Schema);
    expect(output.deleted).toBe(0);
  });

  it("refuses a negative or fractional count", () => {
    expect(() => PurgeAccessLogOutput.create({ deleted: -1 })).toThrow();
    expect(() => PurgeAccessLogOutput.create({ deleted: 1.5 })).toThrow();
  });
});
