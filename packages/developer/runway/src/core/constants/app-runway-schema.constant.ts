/**
 * Stackra file contract:
 * Purpose: `APP_RUNWAY_SCHEMA`, an app member's `runway.yaml` at format version 3: `requires`, the per-brand builds (`brands`), the secret names, the
 *          health check, the release block (PWA, desktop channels, signing switches, feed path and platforms, mobile
 *          build profiles and store submission), telemetry and the values of each environment. Only `version` and
 *          `environments` are required.
 * Boundary: internal; `parseRunway("app", …)` and `runwayJsonSchema("app")` read it, and it accepts what the canonical
 *           `tools/schemas/runway-app.schema.json` accepts. Strict at the top: the member is the folder that holds
 *           the file, so `member` fails, as every root key does.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1 and its 2026-10-23 note: `health`), ADR 0254, ADR 0180, ADR 0173, ADR 0335 (decision 8: brands).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { APP_ENVIRONMENT_SCHEMA } from "#core/constants/app-environment-schema.constant";
import { BRAND_SCHEMA } from "#core/constants/brand-schema.constant";
import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";
import { REQUIREMENT_SCHEMA } from "#core/constants/requirement-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** An app runway. */
export const APP_RUNWAY_SCHEMA = z.strictObject({
  $schema: z.string().optional(),
  version: z.literal(3),
  requires: z.record(z.string(), REQUIREMENT_SCHEMA).optional(),
  secrets: SECRET_NAMES_SCHEMA.optional(),
  brands: z.array(BRAND_SCHEMA).optional(),
  health: z
    .strictObject({
      path: z.string().regex(/^\//, "Expected a path starting with /").optional(),
      expects: z.enum(["sha"]).optional(),
    })
    .optional(),
  release: z
    .strictObject({
      pwa: OPEN_OBJECT_SCHEMA.optional(),
      desktop: z
        .looseObject({
          channels: z.array(z.string()).optional(),
          signing: z.record(z.string(), z.boolean()).optional(),
          feedPath: z.string().optional(),
          platforms: z
            .partialRecord(z.enum(["mac", "windows", "linux"]), z.array(z.string()))
            .optional(),
        })
        .optional(),
      mobile: z
        .looseObject({
          profiles: z
            .record(
              z.string(),
              z.looseObject({
                distribution: z.enum(["internal", "store"]).optional(),
                developmentClient: z.boolean().optional(),
                simulator: z.boolean().optional(),
                androidApk: z.boolean().optional(),
                autoIncrement: z.boolean().optional(),
                environment: z.string().optional(),
              }),
            )
            .optional(),
          submit: z
            .looseObject({ ios: z.boolean().optional(), android: z.boolean().optional() })
            .optional(),
          whiteLabel: z.boolean().optional(),
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
