/**
 * Stackra file contract:
 * Purpose: `SERVICE_ENVIRONMENT_SCHEMA`, one `environments.<env>` block of a service runway: the dev port, host and
 *          dev console port, the size of the logical database (pool budget, plan, storage, extensions, read replica),
 *          of the cache, of each bucket and queue, the cron switch, the secret names, the `config` values and the
 *          cross-app relay's `events`.
 * Boundary: internal. Strict at its top: a root key (`deployable`, `isolate`, `group`, `cpu`, `memory`, `instances`)
 *           fails here. The size blocks stay open, as the canonical schema leaves them.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0238 (logical databases and pool budgets), ADR 0160 (extensions: the
 *                     approved names, `PostgresExtension`), ADR 0511 (decisions 11 to 15, amendment of 2026-11-02).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { CONFIG_VALUES_SCHEMA } from "#core/constants/config-values-schema.constant";
import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";
import { PORT_SCHEMA } from "#core/constants/port-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { SERVICE_EVENTS_SCHEMA } from "#core/constants/service-events-schema.constant";
import { PostgresExtension } from "#core/enums/postgres-extension.enum";

/** One service environment. */
export const SERVICE_ENVIRONMENT_SCHEMA = z.strictObject({
  port: PORT_SCHEMA.optional(),
  host: z.string().optional(),
  devConsolePort: PORT_SCHEMA.optional(),
  database: z
    .looseObject({
      poolBudget: z.int().min(1).optional(),
      plan: z.string().optional(),
      storageGb: z.number().positive().optional(),
      extensions: z
        .array(
          z.enum(Enum.values(PostgresExtension) as [PostgresExtension, ...PostgresExtension[]], {
            error: `Expected an approved extension (ADR 0160): ${Enum.values(PostgresExtension).join(", ")}`,
          }),
        )
        .optional(),
      readReplica: z.boolean().optional(),
    })
    .optional(),
  cache: z
    .looseObject({
      memoryMb: z.int().min(1).optional(),
      replicas: z.int().min(0).optional(),
      eviction: z.string().optional(),
      keyspaceMb: z.int().min(1).optional(),
    })
    .optional(),
  buckets: z.record(z.string(), OPEN_OBJECT_SCHEMA).optional(),
  queues: z
    .record(
      z.string(),
      z.looseObject({
        visibilityTimeoutSeconds: z.int().min(0).optional(),
        dlq: z.boolean().optional(),
      }),
    )
    .optional(),
  crons: z.looseObject({ enabled: z.boolean().optional() }).optional(),
  secrets: SECRET_NAMES_SCHEMA.optional(),
  config: CONFIG_VALUES_SCHEMA.optional(),
  events: SERVICE_EVENTS_SCHEMA.optional(),
});
