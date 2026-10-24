/**
 * Stackra file contract:
 * Purpose: `CreateUploadInput`, the input of `media.upload.create@1`: which bucket, and the media type and size of the
 *          file the client is about to upload. Never the bytes.
 * Boundary: a shape class in schemas/, one declaration per file; it registers this package's own schema
 *           (`CREATE_UPLOAD_INPUT_SCHEMA`) when the module loads, so the pipeline validates with no generated file.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (Input and Output in their own files); ADR 0222
 *                     (decision 2).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import type { MediaType } from "#core/enums/media-type.enum";
import { CREATE_UPLOAD_INPUT_SCHEMA } from "#node/constants/create-upload-input-schema.constant";

/** The bucket and the file's type and size. */
export class CreateUploadInput extends Schema {
  /** The bucket key (`catalogue.product_images`); `null` takes the member's only bucket. */
  bucket!: string | null;

  /** The file's media type, as the browser reports it (`File.type`). */
  mediaType!: MediaType;

  /** The file's size in bytes. */
  @Int({ min: 1 })
  size!: number;
}

registerSchemas([[CreateUploadInput, CREATE_UPLOAD_INPUT_SCHEMA]]);
