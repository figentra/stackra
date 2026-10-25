/**
 * Stackra file contract:
 * Purpose: `FILESYSTEM_CONFIG_SCHEMA`, the zod schema this package ships for `FilesystemConfig` (exported as
 *          `FilesystemConfig$`): the disk, the local root, the public base URL, the S3/R2 bucket and the
 *          Google Cloud Storage bucket.
 * Boundary: the stand-in for what gen writes for this package. Every field and every nested field has a default, so
 *           `.parse({})` gives the full defaults, `.shape.s3.parse(undefined)` gives the nested default and a host's
 *           generated `FilesystemConfig$` extends it with `Base$.shape.<field>.unwrap().default(...)`. The defaults
 *           equal `FilesystemOptions`' initializers (tested). No credential is a field: the S3 driver reads the AWS
 *           credential chain (`AWS_ACCESS_KEY_ID`, an instance role), which runway syncs from Infisical,
 *           and the GCS driver reads Application Default Credentials (workload identity on GCP).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

import { FILE_SYSTEM_DISKS } from "#core/constants/file-system-disks.constant";

/** The shipped `FilesystemConfig$`. */
export const FILESYSTEM_CONFIG_SCHEMA = z.object({
  disk: z.enum(FILE_SYSTEM_DISKS).default("memory"),
  root: z.string().min(1).default("storage"),
  url: z.url().nullable().default(null),
  s3: z
    .object({
      bucket: z.string().default(""),
      region: z.string().min(1).default("us-east-1"),
      endpoint: z.url().nullable().default(null),
      forcePathStyle: z.boolean().default(false),
    })
    .default(() => ({ bucket: "", region: "us-east-1", endpoint: null, forcePathStyle: false })),
  gcs: z
    .object({
      bucket: z.string().default(""),
      projectId: z.string().min(1).nullable().default(null),
    })
    .default(() => ({ bucket: "", projectId: null })),
});
