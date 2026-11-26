/**
 * Stackra file contract:
 * Purpose: `CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA`, the zod schema this package ships for
 *          `CreateResumableUploadOutput`: the token, the tus server's creation URL with the headers that start the
 *          upload, and the expiry as an ISO 8601 date-time on the wire.
 * Boundary: the stand-in for what gen writes for this package; `CreateResumableUploadOutput.create` builds with it. The
 *           `Date` field is the `isoDateTime` codec, as gen writes for every `Date`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0095 as amended; ADR 0222 (decision 2).
 */
import { isoDateTime } from "@stackra/validation";
import { z } from "zod";

import { Upload } from "#core/values/upload.value";

/** The shipped `CreateResumableUploadOutput$`. */
export const CREATE_RESUMABLE_UPLOAD_OUTPUT_SCHEMA = z.object({
  upload: Upload.schema,
  url: z.string().min(1),
  headers: z.record(z.string(), z.string()),
  expiresAt: isoDateTime(),
});
