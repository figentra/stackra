/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: it exports every value the template imports (`Bucket`,
 *          `BucketVisibility`, `ImageFormat`, `MediaLibrary`, `MediaType`, `Upload`, `UploadBucketMismatchError`) and
 *          the rest of the public surface, nothing else, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type {
  BucketClass,
  BucketOptions,
  BucketRegistration,
  ImageVariant,
  ImageVariantOptions,
  MediaFile,
  PendingUpload,
} from "#core/index";

describe("@stackra/media", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "Bucket",
      "BucketVisibility",
      "HttpUploaderDriver",
      "ImageFormat",
      "MediaConfig",
      "MediaConfig$",
      "MediaLibrary",
      "MediaOptions",
      "MediaType",
      "MemoryFileScannerDriver",
      "MemoryMediaDiskDriver",
      "MemoryUploaderDriver",
      "Upload",
      "UploadBucketMismatchError",
      "UploadExpiredError",
      "UploadFailedError",
      "UploadIncompleteError",
      "UploadRejectedError",
      "Uploader",
      "registerBuckets",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<BucketOptions["maxBytes"]>().toEqualTypeOf<number>();
    expectTypeOf<BucketRegistration["type"]>().toEqualTypeOf<BucketClass>();
    expectTypeOf<ImageVariantOptions["width"]>().toEqualTypeOf<number>();
    expectTypeOf<ImageVariant["url"]>().toEqualTypeOf<string>();
    expectTypeOf<MediaFile["mediaType"]>().toEqualTypeOf<core.MediaType>();
    expectTypeOf<PendingUpload["upload"]>().toEqualTypeOf<core.Upload>();
  });
});
