/**
 * Stackra file contract:
 * Purpose: `CreateUploadOutput`, the output of `media.upload.create@1`: the token the client later sends to the
 *          claiming action, the signed URL and headers it puts the bytes with, and when both expire.
 * Boundary: a shape class in schemas/, one declaration per file; it registers this package's own schema
 *           (`CREATE_UPLOAD_OUTPUT_SCHEMA`) when the module loads, so `CreateUploadOutput.create` works with no
 *           generated file. The signed URL is a short-lived credential for one object: it is returned to the caller
 *           only, never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (Input and Output in their own files); ADR 0222
 *                     (decision 2).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import type { Upload } from "#core/values/upload.value";
import { CREATE_UPLOAD_OUTPUT_SCHEMA } from "#node/constants/create-upload-output-schema.constant";

/** The token and where to put the bytes. */
export class CreateUploadOutput extends Schema {
  /** The token to send to the claiming action. */
  upload!: Upload;

  /** The signed URL. */
  url!: string;

  /** Always `PUT`. */
  method!: "PUT";

  /** The headers to send with the bytes, exactly as given. */
  headers!: Record<string, string>;

  /** When the URL and the token expire. */
  expiresAt!: Date;
}

registerSchemas([[CreateUploadOutput, CREATE_UPLOAD_OUTPUT_SCHEMA]]);
