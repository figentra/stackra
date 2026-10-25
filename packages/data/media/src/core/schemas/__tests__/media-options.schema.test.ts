/**
 * Stackra file contract:
 * Purpose: unit and type tests of `MediaOptions`: its initializers equal the shipped schema's defaults, it registers
 *          that schema for itself, and its driver fields take only this package's names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 26).
 */
import type { DriverName } from "@stackra/container";
import { schemaOf } from "@stackra/validation";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { MediaDisk } from "#contracts/ports/media-disk.port";
import { MEDIA_CONFIG_SCHEMA } from "#core/constants/media-config-schema.constant";
import type { Uploader } from "#core/ports/uploader.port";
import { MediaOptions } from "#core/schemas/media-options.schema";

describe("MediaOptions", () => {
  it("initializes to the shipped schema's defaults", () => {
    expect({ ...new MediaOptions() }).toEqual(MEDIA_CONFIG_SCHEMA.parse({}));
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(MediaOptions)).toBe(MEDIA_CONFIG_SCHEMA);
  });

  it("types the driver fields by this package's names", () => {
    expectTypeOf<DriverName<MediaDisk>>().toEqualTypeOf<"memory" | "s3">();
    expectTypeOf<DriverName<Uploader>>().toEqualTypeOf<"memory" | "http">();
    expectTypeOf<MediaOptions["disk"]>().toEqualTypeOf<"memory" | "s3">();
  });
});
