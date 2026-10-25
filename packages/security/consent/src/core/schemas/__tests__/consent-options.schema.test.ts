/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentOptions`: its initializers equal the shipped schema's defaults, and it registers that
 *          schema for itself.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 19 and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { CONSENT_CONFIG_SCHEMA } from "#core/constants/consent-config-schema.constant";
import { ConsentOptions } from "#core/schemas/consent-options.schema";

describe("ConsentOptions", () => {
  it("defaults to what the shipped schema defaults to", () => {
    expect({ ...new ConsentOptions() }).toEqual(CONSENT_CONFIG_SCHEMA.parse({}));
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(ConsentOptions)).toBe(CONSENT_CONFIG_SCHEMA);
  });
});
