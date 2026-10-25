/**
 * Stackra file contract:
 * Purpose: `CREATE_UPLOAD_INPUT_SCHEMA`, the zod schema this package ships for `CreateUploadInput`: a bucket key or
 *          `null`, one of the `MediaType` codes and a whole size in bytes.
 * Boundary: the stand-in for what gen writes for this package; the pipeline validates the call's input with it, the
 *           trust boundary of the upload flow. The bucket key's form matches `registerBuckets`; whether the bucket
 *           exists and takes the type and size is `MediaLibrary`'s check.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0095 as amended.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { MediaType } from "#core/enums/media-type.enum";

/** The shipped `CreateUploadInput$`. */
export const CREATE_UPLOAD_INPUT_SCHEMA = z.object({
  bucket: z
    .string()
    .max(120)
    .regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/)
    .nullable(),
  mediaType: z.enum(Enum.values(MediaType)),
  size: z.number().int().min(1),
});
