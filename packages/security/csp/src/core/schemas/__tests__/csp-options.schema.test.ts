/**
 * Stackra file contract:
 * Purpose: unit tests of `CspOptions`: a new instance holds the defaults, and loading the module registers the
 *          package's own schema for it, so `buildConfig` and `validate` find `CspOptions$` without gen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf, validate } from "@stackra/validation";

import { CSP_OPTIONS_SCHEMA } from "#core/constants/csp-options-schema.constant";
import { CspOptions } from "#core/schemas/csp-options.schema";

describe("CspOptions", () => {
  it("is a shape class holding the defaults", () => {
    const options = new CspOptions();
    expect(options).toBeInstanceOf(Schema);
    expect({ ...options }).toEqual({
      extraConnectSrc: [],
      extraFrameSrc: [],
      extraImgSrc: [],
      reportOnly: false,
    });
  });

  it("gives each instance its own lists", () => {
    expect(new CspOptions().extraImgSrc).not.toBe(new CspOptions().extraImgSrc);
  });

  it("registers its shipped schema when the module loads", () => {
    expect(schemaOf(CspOptions)).toBe(CSP_OPTIONS_SCHEMA);
    const result = validate(CspOptions, { extraImgSrc: ["https://media.acme.example"] });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(CspOptions);
    expect(result.data?.extraImgSrc).toEqual(["https://media.acme.example"]);
    expect(result.data?.reportOnly).toBe(false);
    expect(validate(CspOptions, { extraImgSrc: ["'unsafe-inline'"] }).success).toBe(false);
  });
});
