/**
 * Stackra file contract:
 * Purpose: unit tests of `FILESYSTEM_CONFIG_SCHEMA`: full defaults from `{}`, nested defaults from `undefined`, the
 *          disk names closed to the shipped drivers, URLs checked, and the generated host form
 *          `Base$.shape.s3.unwrap().default(...)`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { FILESYSTEM_CONFIG_SCHEMA } from "#core/constants/filesystem-config-schema.constant";

const DEFAULT_S3 = { bucket: "", region: "us-east-1", endpoint: null, forcePathStyle: false };

describe("FILESYSTEM_CONFIG_SCHEMA", () => {
  it("parses {} to the full defaults", () => {
    expect(FILESYSTEM_CONFIG_SCHEMA.parse({})).toEqual({
      disk: "memory",
      root: "storage",
      url: null,
      s3: DEFAULT_S3,
    });
  });

  it("gives the nested default for an absent s3 and fills a partial one", () => {
    expect(FILESYSTEM_CONFIG_SCHEMA.shape.s3.parse(undefined)).toEqual(DEFAULT_S3);
    expect(FILESYSTEM_CONFIG_SCHEMA.parse({ s3: { bucket: "acme-files" } }).s3).toEqual({
      ...DEFAULT_S3,
      bucket: "acme-files",
    });
  });

  it("takes the runway values of the template", () => {
    expect(FILESYSTEM_CONFIG_SCHEMA.parse({ disk: "local" }).disk).toBe("local");
    expect(FILESYSTEM_CONFIG_SCHEMA.parse({ disk: "s3" }).disk).toBe("s3");
  });

  it("refuses an unknown disk, a bad URL and an empty root", () => {
    expect(FILESYSTEM_CONFIG_SCHEMA.safeParse({ disk: "ftp" }).success).toBe(false);
    expect(FILESYSTEM_CONFIG_SCHEMA.safeParse({ url: "not a url" }).success).toBe(false);
    expect(FILESYSTEM_CONFIG_SCHEMA.safeParse({ root: "" }).success).toBe(false);
    expect(FILESYSTEM_CONFIG_SCHEMA.safeParse({ s3: { endpoint: "nope" } }).success).toBe(false);
  });

  it("is extended by a host's generated schema", () => {
    const Host$ = FILESYSTEM_CONFIG_SCHEMA.extend({
      s3: FILESYSTEM_CONFIG_SCHEMA.shape.s3.unwrap().default(() => ({
        ...FILESYSTEM_CONFIG_SCHEMA.shape.s3.parse(undefined),
        bucket: "acme-files",
      })),
    });
    expect(Host$.parse({}).s3).toEqual({ ...DEFAULT_S3, bucket: "acme-files" });
  });
});
