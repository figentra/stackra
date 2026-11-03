/**
 * Stackra file contract:
 * Purpose: `APP_RUNWAY_SCHEMA`, an app member's `runway.yaml` at format version 3: `requires`, the secret names, the
 *          health check, the release block (the desktop feed path, each mobile build profile's EAS environment and store
 *          submission), telemetry and the values of each environment. Only `version` and `environments` are required.
 *          Removed by STA-2028, as no repository set them and nothing read them: `brands` (ADR 0335 puts brands in
 *          `stackra.config.ts`), `release.pwa` (ADR 0326 decision 6), desktop `channels`, `signing` and `platforms`
 *          (ADR 0344 decision 7; they return with the desktop release job), the profile flags `easJsonOf` sets
 *          (`distribution`, `developmentClient`, `simulator`, `androidApk`, `autoIncrement`) and `release.mobile.whiteLabel`
 *          (the root `mobile.<app>.whiteLabel` is the one read). The release blocks are strict, so each fails now.
 * Boundary: internal; `parseRunway("app", …)` and `runwayJsonSchema("app")` read it, and it accepts what the canonical
 *           `tools/schemas/runway-app.schema.json` accepts. Strict at the top: the member is the folder that holds
 *           the file, so `member` fails, as every root key does.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1 and its 2026-10-23 note: `health`), ADR 0254, ADR 0180, ADR 0173, ADR 0335 (decision 8: brands), ADR 0326, ADR 0344; STA-2028.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { APP_ENVIRONMENT_SCHEMA } from "#core/constants/app-environment-schema.constant";
import { REQUIREMENT_SCHEMA } from "#core/constants/requirement-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** An app runway. */
export const APP_RUNWAY_SCHEMA = z.strictObject({
  $schema: z.string().optional(),
  version: z.literal(3),
  requires: z.record(z.string(), REQUIREMENT_SCHEMA).optional(),
  secrets: SECRET_NAMES_SCHEMA.optional(),
  health: z
    .strictObject({
      path: z.string().regex(/^\//, "Expected a path starting with /").optional(),
      expects: z.enum(["sha"]).optional(),
    })
    .optional(),
  release: z
    .strictObject({
      desktop: z.strictObject({ feedPath: z.string().optional() }).optional(),
      mobile: z
        .strictObject({
          profiles: z
            .record(z.string(), z.strictObject({ environment: z.string().optional() }))
            .optional(),
          submit: z
            .looseObject({ ios: z.boolean().optional(), android: z.boolean().optional() })
            .optional(),
        })
        .optional(),
    })
    .optional(),
  telemetry: z.strictObject({ sentryProject: z.string().optional() }).optional(),
  environments: z.partialRecord(
    z.enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]]),
    APP_ENVIRONMENT_SCHEMA,
  ),
});
