/**
 * Stackra file contract:
 * Purpose: `CreateResumableUploadOutput`, the output of `media.upload.create_resumable@1`: the token the client later
 *          sends to the claiming action, the tus server's creation URL and the headers it starts the upload with, and
 *          when the token expires.
 * Boundary: a shape class in schemas/, one declaration per file; it registers this package's own schema
 *           (`CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA`) when the module loads, so `CreateResumableUploadOutput.create`
 *           works with no generated file. Nothing here is a credential: the tus server admits the upload id once,
 *           through its pre-create hook.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (Input and Output in their own files); ADR 0222
 *                     (decision 2: tus uploads).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import type { Upload } from "#core/values/upload.value";
import { CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA } from "#node/constants/create-resumable-upload-output-schema.constant";

/** The token and where to start the tus upload. */
export class CreateResumableUploadOutput extends Schema {
  /** The token to send to the claiming action. */
  upload!: Upload;

  /** The tus server's creation URL. */
  url!: string;

  /** The headers to start the upload with, exactly as given (`tus-resumable`, `upload-metadata`). */
  headers!: Record<string, string>;

  /** When the token expires. */
  expiresAt!: Date;
}

registerSchemas([[CreateResumableUploadOutput, CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA]]);
