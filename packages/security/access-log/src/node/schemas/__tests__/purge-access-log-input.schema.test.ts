/**
 * Stackra file contract:
 * Purpose: unit tests of `PurgeAccessLogInput`: a registered shape with no fields, built with `create`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { PurgeAccessLogInput } from "#node/schemas/purge-access-log-input.schema";

describe("PurgeAccessLogInput", () => {
  it("is a registered shape with no fields", () => {
    expect(PurgeAccessLogInput.create({})).toBeInstanceOf(Schema);
    expect(schemaOf(PurgeAccessLogInput).parse({})).toEqual({});
  });
});
