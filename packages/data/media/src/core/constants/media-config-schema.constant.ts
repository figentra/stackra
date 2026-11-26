/**
 * Stackra file contract:
 * Purpose: `MEDIA_CONFIG_SCHEMA`, the zod schema this package ships for `MediaConfig` (exported as `MediaConfig$`): the
 *          client's uploader, how long a signed upload and a resumable (tus) upload stay valid, where the HTTP and tus uploaders ask for one, the tus
 *          server with its chunk size and retry pauses, the tus hook password slot, the in-region OCR service and the
 *          C2PA signing slot.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `MediaOptions`' initializers (tested). Both upload lifetimes are at most seven days, read in either duration form (stackra-223) and stored canonical:
 *           for a signed upload that is the SigV4 limit of its URL; a tus upload (default a day) keeps the same bound so
 *           the `uploads/` lifecycle rule can outlast every one. No `disk` field: media stores on the one `FileSystem` disk that
 *           `filesystem.disk` picks (ADR 0465, stackra-226). The C2PA
 *           certificate and key and the tus hook password are `@Secret` names (empty strings until set), never values
 *           in a layer.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { C2PA_ALGORITHMS } from "#core/constants/c2pa-algorithms.constant";
import { MEDIA_SCANNERS } from "#core/constants/media-scanners.constant";
import { MEDIA_UPLOADERS } from "#core/constants/media-uploaders.constant";

/** The longest a signed URL may live. */
const SEVEN_DAYS = Duration.toMilliseconds(Duration.days(7));

/** A duration longer than zero and at most seven days, in ISO 8601 (`PT1H`) or the short form (`1h`), read into its
 * canonical form so the signer can time it. */
const UPLOAD_LIFETIME = z.string().transform((text, context): Duration => {
  try {
    const lifetime = Duration.parse(text);
    const milliseconds = Duration.toMilliseconds(lifetime);
    if (milliseconds > 0 && milliseconds <= SEVEN_DAYS) return lifetime;
  } catch {
    // not a duration: the issue below
  }
  context.addIssue({
    code: "custom",
    message: `"${text}" is not a duration longer than zero and at most seven days, such as PT1H or 1h`,
  });
  return z.NEVER;
});

/** The shipped `MediaConfig$`. */
export const MEDIA_CONFIG_SCHEMA = z.object({
  uploader: z.enum(MEDIA_UPLOADERS).default("memory"),
  uploadExpiresIn: UPLOAD_LIFETIME.default(Duration.hours(1)),
  resumableUploadExpiresIn: UPLOAD_LIFETIME.default(Duration.days(1)),
  uploadEndpoint: z.string().min(1).default("/api/uploads"),
  resumableUploadEndpoint: z.string().min(1).default("/api/uploads/create-resumable"),
  tus: z
    .object({
      endpoint: z.string().min(1).default("/files/"),
      chunkBytes: z.number().int().min(1).default(8_388_608),
      retryDelaysMs: z
        .array(z.number().int().min(0).max(300_000))
        .max(20)
        .default(() => [0, 1000, 3000, 5000, 10_000]),
    })
    .default(() => ({
      endpoint: "/files/",
      chunkBytes: 8_388_608,
      retryDelaysMs: [0, 1000, 3000, 5000, 10_000],
    })),
  tusHookSecret: z.string().default(""),
  scanner: z.enum(MEDIA_SCANNERS).default("memory"),
  clamav: z
    .object({
      host: z.string().min(1).default("127.0.0.1"),
      port: z.number().int().min(1).max(65_535).default(3310),
      maxBytes: z.number().int().min(1).default(26_214_400),
    })
    .default(() => ({ host: "127.0.0.1", port: 3310, maxBytes: 26_214_400 })),
  ocr: z
    .object({
      endpoint: z.url().default("http://127.0.0.1:8080/ocr"),
      languages: z
        .array(z.string().min(2))
        .min(1)
        .default(() => ["ar", "en"]),
      maxBytes: z.number().int().min(1).default(20_971_520),
      timeoutMs: z.number().int().min(1).default(60_000),
    })
    .default(() => ({
      endpoint: "http://127.0.0.1:8080/ocr",
      languages: ["ar", "en"],
      maxBytes: 20_971_520,
      timeoutMs: 60_000,
    })),
  c2pa: z
    .object({
      algorithm: z.enum(C2PA_ALGORITHMS).default("es256"),
      timestampUrl: z.union([z.literal(""), z.url()]).default(""),
      formats: z
        .array(z.string().regex(/^image\/[a-z0-9.+-]+$/))
        .min(1)
        .default(() => ["image/jpeg", "image/png", "image/webp"]),
    })
    .default(() => ({
      algorithm: "es256" as const,
      timestampUrl: "",
      formats: ["image/jpeg", "image/png", "image/webp"],
    })),
  c2paSigningCertificate: z.string().default(""),
  c2paSigningKey: z.string().default(""),
});
