/**
 * Stackra file contract:
 * Purpose: unit tests of `ISSUER_CONFIG_SCHEMA`: its defaults equal `IssuerOptions`' initializers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { ISSUER_CONFIG_SCHEMA } from "#core/constants/issuer-config-schema.constant";
import { IssuerOptions } from "#core/schemas/issuer-options.schema";

describe("ISSUER_CONFIG_SCHEMA", () => {
  it("defaults to the shape class's initializers", () => {
    expect(ISSUER_CONFIG_SCHEMA.parse({})).toEqual({ ...new IssuerOptions() });
  });
});
