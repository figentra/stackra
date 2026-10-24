/**
 * Stackra file contract:
 * Purpose: `CREATE_UPLOAD_OUTPUT_SCHEMA`, the zod schema this package ships for `CreateUploadOutput`: the token, the
 *          signed URL with its method and headers, and the expiry as an ISO 8601 date-time on the wire.
 * Boundary: the stand-in for what gen writes for this package; `CreateUploadOutput.create` builds with it. The
 *           `Date` field is the `isoDateTime` codec, as gen writes for every `Date`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0095 as amended.
 */
import { isoDateTime } from "@stackra/validation";
import { z } from "zod";

import { Upload } from "#core/values/upload.value";

/** The shipped `CreateUploadOutput$`. */
export const CREATE_UPLOAD_OUTPUT_SCHEMA = z.object({
  upload: Upload.schema,
  url: z.string().min(1),
  method: z.literal("PUT"),
  headers: z.record(z.string(), z.string()),
  expiresAt: isoDateTime(),
});
