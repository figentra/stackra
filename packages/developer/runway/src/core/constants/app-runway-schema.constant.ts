/**
 * Stackra file contract:
 * Purpose: `APP_RUNWAY_SCHEMA`, an app member's `runway.yaml` at format version 3: secret names, `requires`, the
 *          health check, the release block (PWA updates, desktop channels, signing switches and feed path, mobile
 *          build profiles and store submission), telemetry and the values of each environment.
 * Boundary: internal; `parseRunway("app", …)` and `runwayJsonSchema("app")` read it. Strict at the top: the member is
 *           the folder that holds the file, so `member` fails, as every root key does.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1 and its 2026-10-23 note: `health`), ADR 0254, ADR 0255, ADR 0173.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { APP_ENVIRONMENT_SCHEMA } from "#core/constants/app-environment-schema.constant";
import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { REQUIREMENT_SCHEMA } from "#core/constants/requirement-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** An app runway. */
export const APP_RUNWAY_SCHEMA = z.strictObject({
  $schema: z.string().optional(),
  version: z.literal(3),
  requires: z.record(KEY_SCHEMA, REQUIREMENT_SCHEMA).optional(),
  secrets: SECRET_NAMES_SCHEMA.default([]),
  health: z
    .strictObject({ path: z.string().startsWith("/"), expects: z.string().min(1) })
    .optional(),
  release: z
    .strictObject({
      pwa: z
        .strictObject({
          updates: z.string().min(1),
          betaBadgeOutsideProduction: z.boolean().optional(),
        })
        .optional(),
      desktop: z
        .strictObject({
          channels: z.array(KEY_SCHEMA).min(1),
          signing: z
            .strictObject({
              mac: z.boolean().optional(),
              windows: z.boolean().optional(),
              linux: z.boolean().optional(),
            })
            .optional(),
          feedPath: KEY_SCHEMA,
          platforms: z
            .strictObject({
              mac: z.array(z.string().min(1)).optional(),
              windows: z.array(z.string().min(1)).optional(),
              linux: z.array(z.string().min(1)).optional(),
            })
            .optional(),
        })
        .optional(),
      mobile: z
        .strictObject({
          profiles: z.record(
            KEY_SCHEMA,
            z.strictObject({
              distribution: z.enum(["internal", "store"]),
              developmentClient: z.boolean().optional(),
              simulator: z.boolean().optional(),
              androidApk: z.boolean().optional(),
              autoIncrement: z.boolean().optional(),
              environment: KEY_SCHEMA,
            }),
          ),
          submit: z
            .strictObject({ ios: z.boolean().optional(), android: z.boolean().optional() })
            .optional(),
          whiteLabel: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  telemetry: z.strictObject({ sentryProject: KEY_SCHEMA.optional() }).optional(),
  environments: z.partialRecord(
    z.enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]]),
    APP_ENVIRONMENT_SCHEMA,
  ),
});
