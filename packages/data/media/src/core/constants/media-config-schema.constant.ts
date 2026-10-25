/**
 * Stackra file contract:
 * Purpose: `MEDIA_CONFIG_SCHEMA`, the zod schema this package ships for `MediaConfig` (exported as `MediaConfig$`): the
 *          server's disk, the client's uploader, how long an upload stays valid and where the HTTP uploader asks for
 *          one.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `MediaOptions`' initializers (tested). The upload lifetime is at most seven days,
 *           the SigV4 limit of a signed URL. No credential is a field: the S3 driver reads the AWS credential chain.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { MEDIA_DISKS } from "#core/constants/media-disks.constant";
import { MEDIA_SCANNERS } from "#core/constants/media-scanners.constant";
import { MEDIA_UPLOADERS } from "#core/constants/media-uploaders.constant";

/** The longest a signed URL may live. */
const SEVEN_DAYS = Duration.toMilliseconds(Duration.days(7));

/** Whether `value` is a duration longer than zero and at most seven days. */
function isUploadLifetime(value: unknown): value is Duration {
  if (typeof value !== "string") return false;
  try {
    const milliseconds = Duration.toMilliseconds(Duration.parse(value));
    return milliseconds > 0 && milliseconds <= SEVEN_DAYS;
  } catch {
    return false;
  }
}

/** The shipped `MediaConfig$`. */
export const MEDIA_CONFIG_SCHEMA = z.object({
  disk: z.enum(MEDIA_DISKS).default("memory"),
  uploader: z.enum(MEDIA_UPLOADERS).default("memory"),
  uploadExpiresIn: z
    .custom<Duration>(isUploadLifetime, {
      message:
        "Expected an ISO 8601 duration longer than zero and at most seven days, such as PT1H",
    })
    .default(Duration.hours(1)),
  uploadEndpoint: z.string().min(1).default("/api/uploads"),
  scanner: z.enum(MEDIA_SCANNERS).default("memory"),
  clamav: z
    .object({
      host: z.string().min(1).default("127.0.0.1"),
      port: z.number().int().min(1).max(65535).default(3310),
      maxBytes: z.number().int().min(1).default(26_214_400),
    })
    .default(() => ({ host: "127.0.0.1", port: 3310, maxBytes: 26_214_400 })),
});
