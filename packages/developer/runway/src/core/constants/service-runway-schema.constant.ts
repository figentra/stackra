/**
 * Stackra file contract:
 * Purpose: `SERVICE_RUNWAY_SCHEMA`, a service member's `runway.yaml` at format version 3: the resources it `requires`
 *          (a dedicated one with its reason), the secret names, the readiness and liveness thresholds, and the values
 *          of each environment. Only `version` and `environments` are required.
 * Boundary: internal; `parseRunway("service", …)` and `runwayJsonSchema("service")` read it, and it accepts what the
 *           canonical `tools/schemas/runway-service.schema.json` accepts. Strict at the top: `member`, `deployable`,
 *           `isolate`, `group`, `cpu`, `memory` and `instances` fail (root facts).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 5, and its 2026-10-23 note: `health`), ADR 0173, ADR 0190.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { REQUIREMENT_SCHEMA } from "#core/constants/requirement-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { SERVICE_ENVIRONMENT_SCHEMA } from "#core/constants/service-environment-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** A service runway. */
export const SERVICE_RUNWAY_SCHEMA = z.strictObject({
  $schema: z.string().optional(),
  version: z.literal(3),
  requires: z.record(z.string(), REQUIREMENT_SCHEMA).optional(),
  secrets: SECRET_NAMES_SCHEMA.optional(),
  health: z
    .strictObject({
      readiness: z
        .looseObject({
          requireMigrations: z.boolean().optional(),
          timeoutSeconds: z.number().positive().optional(),
        })
        .optional(),
      liveness: z.looseObject({ eventLoopLagMs: z.int().min(1).optional() }).optional(),
    })
    .optional(),
  environments: z.partialRecord(
    z.enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]]),
    SERVICE_ENVIRONMENT_SCHEMA,
  ),
});
