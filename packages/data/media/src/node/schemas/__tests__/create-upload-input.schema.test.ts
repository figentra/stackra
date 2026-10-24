/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateUploadInput`: its shipped schema is registered, takes a bucket key or `null`, a
 *          `MediaType` and a whole size from 1, and refuses anything else at the trust boundary.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { schemaOf } from "@stackra/validation";
import { describe, expect, it } from "@stackra/testing";

import { MediaType } from "#core/enums/media-type.enum";
import { CREATE_UPLOAD_INPUT_SCHEMA } from "#node/constants/create-upload-input-schema.constant";
import { CreateUploadInput } from "#node/schemas/create-upload-input.schema";

describe("CreateUploadInput", () => {
  it("registers its shipped schema", () => {
    expect(schemaOf(CreateUploadInput)).toBe(CREATE_UPLOAD_INPUT_SCHEMA);
  });

  it("builds from a bucket key or null", () => {
    expect(
      CreateUploadInput.create({
        bucket: "catalogue.product_images",
        mediaType: MediaType.Png,
        size: 1,
      }),
    ).toMatchObject({ bucket: "catalogue.product_images", mediaType: "image/png", size: 1 });
    expect(
      CreateUploadInput.create({ bucket: null, mediaType: MediaType.Pdf, size: 9 }).bucket,
    ).toBe(null);
  });

  it.each([
    { bucket: "../uploads", mediaType: "image/png", size: 1 },
    { bucket: "Catalogue.Images", mediaType: "image/png", size: 1 },
    { bucket: null, mediaType: "image/svg+xml", size: 1 },
    { bucket: null, mediaType: "image/png", size: 0 },
    { bucket: null, mediaType: "image/png", size: 1.5 },
    { bucket: null, mediaType: "image/png" },
  ])("refuses %j", (value) => {
    expect(CREATE_UPLOAD_INPUT_SCHEMA.safeParse(value).success).toBe(false);
  });
});
