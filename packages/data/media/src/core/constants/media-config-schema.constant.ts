/**
 * Stackra file contract:
 * Purpose: `MEDIA_CONFIG_SCHEMA`, the zod schema this package ships for `MediaConfig` (exported as `MediaConfig$`): the
 *          client's uploader, how long an upload stays valid, where the HTTP uploader asks for
 *          one, the malware scanner, the in-region OCR service, the C2PA signing slot and the running environment. A
 *          deployed environment (`isDeployedEnvironment` of @stackra/config: `preview`, `staging`, `production`)
 *          refuses the `memory` scanner, which calls every file but the EICAR test file clean, so `buildConfig` (and
 *          with it boot) fails with `ConfigInvalidError` naming `scanner` (STA-669).
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `MediaOptions`' initializers (tested). The upload lifetime is at most seven days, read in either duration form (stackra-223) and stored canonical,
 *           the SigV4 limit of a signed URL. No `disk` field: media stores on the one `FileSystem` disk that
 *           `filesystem.disk` picks (ADR 0465, stackra-226). The C2PA
 *           certificate and key are `@Secret` names (empty strings until set), never values in a layer. `environment`
 *           is the closed `StackraEnvironment` list and comes only from `STACKRA_ENVIRONMENT` in the runtime (the one
 *           reader, STA-2844); this package keeps no environment list of its own. The refusal is a refinement of the
 *           object, so `.shape` stays readable.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config);
 *                     ADR 0222 (an unscanned file is never served); ADR 0266 (decision 2: a memory driver never reaches
 *                     a deployment); ADR 0296 (amendment 2026-11-26: the environment comes from the runtime only);
 *                     STA-2844; STA-669.
 */
import { isDeployedEnvironment, StackraEnvironment } from "@stackra/config";
import { Duration, Enum } from "@stackra/contracts";
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
export const MEDIA_CONFIG_SCHEMA = z
  .object({
    uploader: z.enum(MEDIA_UPLOADERS).default("memory"),
    uploadExpiresIn: UPLOAD_LIFETIME.default(Duration.hours(1)),
    uploadEndpoint: z.string().min(1).default("/api/uploads"),
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
    // the one closed list (@stackra/config): a typo fails config, never runs as dev
    environment: z.enum(Enum.values(StackraEnvironment)).default(StackraEnvironment.Dev),
  })
  .superRefine((value, context) => {
    if (value.scanner !== "memory" || !isDeployedEnvironment(value.environment)) return;
    context.addIssue({
      code: "custom",
      path: ["scanner"],
      message:
        "the memory scanner finds only the EICAR test file and calls every other file clean, so " +
        `${value.environment} refuses it: select guard_duty or clamav (runway config.media.scanner)`,
    });
  });
