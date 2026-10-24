/**
 * Stackra file contract:
 * Purpose: unit and type tests of `FilesystemOptions`: a shape whose initializers equal the shipped schema's defaults,
 *          registered with that schema, with `disk` typed as the `FileSystem` driver names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 4 and
 *                     26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { FILESYSTEM_CONFIG_SCHEMA } from "#core/constants/filesystem-config-schema.constant";
import { FilesystemOptions } from "#core/schemas/filesystem-options.schema";

describe("FilesystemOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new FilesystemOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(FilesystemOptions)).toBe(FILESYSTEM_CONFIG_SCHEMA);
  });

  it("has initializers equal to the shipped defaults", () => {
    expect({ ...new FilesystemOptions() }).toEqual(FILESYSTEM_CONFIG_SCHEMA.parse({}));
  });

  it("types disk as the FileSystem driver names", () => {
    expectTypeOf<FilesystemOptions["disk"]>().toEqualTypeOf<
      "memory" | "local" | "s3" | "encore_bucket" | "electron"
    >();
    expectTypeOf<FilesystemOptions["url"]>().toEqualTypeOf<string | null>();
  });
});
