/**
 * Stackra file contract:
 * Purpose: unit and type tests of `MediaOptions`: its initializers equal the shipped schema's defaults, it registers
 *          that schema for itself, its driver fields take only this package's names, and it
 *          has no `disk` field (ADR 0465).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 26).
 */
import type { DriverName } from "@stackra/container";
import { schemaOf } from "@stackra/validation";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { FileScanner } from "#contracts/ports/file-scanner.port";
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
    expectTypeOf<DriverName<Uploader>>().toEqualTypeOf<"memory" | "http">();
    expectTypeOf<DriverName<FileScanner>>().toEqualTypeOf<"memory" | "clamav" | "guard_duty">();
    expectTypeOf<MediaOptions["scanner"]>().toEqualTypeOf<"memory" | "clamav" | "guard_duty">();
  });

  it("has no disk field: media stores on the FileSystem disk (ADR 0465)", () => {
    expect("disk" in new MediaOptions()).toBe(false);
    expect(Object.keys(MEDIA_CONFIG_SCHEMA.shape)).not.toContain("disk");
  });
});
