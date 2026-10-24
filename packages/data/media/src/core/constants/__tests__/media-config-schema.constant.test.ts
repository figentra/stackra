/**
 * Stackra file contract:
 * Purpose: unit tests of `MEDIA_CONFIG_SCHEMA` (`MediaConfig$`): full defaults from `{}`, only this package's driver
 *          names, and an upload lifetime above zero and at most seven days.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MEDIA_CONFIG_SCHEMA } from "#core/constants/media-config-schema.constant";

describe("MEDIA_CONFIG_SCHEMA", () => {
  it("gives the full defaults", () => {
    expect(MEDIA_CONFIG_SCHEMA.parse({})).toEqual({
      disk: "memory",
      uploader: "memory",
      uploadExpiresIn: "PT1H",
      uploadEndpoint: "/api/uploads",
    });
  });

  it("takes only this package's drivers", () => {
    expect(MEDIA_CONFIG_SCHEMA.parse({ disk: "s3", uploader: "http" })).toMatchObject({
      disk: "s3",
      uploader: "http",
    });
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ disk: "local" }).success).toBe(false);
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ uploader: "tus" }).success).toBe(false);
  });

  it("takes an upload lifetime above zero and up to seven days", () => {
    expect(MEDIA_CONFIG_SCHEMA.parse({ uploadExpiresIn: Duration.days(7) }).uploadExpiresIn).toBe(
      "P7D",
    );
    for (const lifetime of ["PT0S", "P8D", "1h", 3_600])
      expect(MEDIA_CONFIG_SCHEMA.safeParse({ uploadExpiresIn: lifetime }).success).toBe(false);
  });

  it("refuses an empty endpoint", () => {
    expect(MEDIA_CONFIG_SCHEMA.safeParse({ uploadEndpoint: "" }).success).toBe(false);
  });
});
