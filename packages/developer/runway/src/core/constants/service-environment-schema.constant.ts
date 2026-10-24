/**
 * Stackra file contract:
 * Purpose: `SERVICE_ENVIRONMENT_SCHEMA`, one `environments.<env>` block of a service runway: the dev port, the
 *          database plan, storage, extensions, pool budget and read replica, the cache size, replicas and eviction,
 *          bucket sizes, queue settings, the cron switch and the `config` values.
 * Boundary: internal. Strict: a root key (`deployable`, `isolate`, `group`, `cpu`, `memory`, `instances`) fails here.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0160 (approved Postgres extensions).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { CONFIG_VALUES_SCHEMA } from "#core/constants/config-values-schema.constant";
import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { PORT_SCHEMA } from "#core/constants/port-schema.constant";
import { CacheEviction } from "#core/enums/cache-eviction.enum";

/** One service environment. */
export const SERVICE_ENVIRONMENT_SCHEMA = z.strictObject({
  port: PORT_SCHEMA.optional(),
  database: z
    .strictObject({
      plan: z.enum(["shared", "dedicated"]).optional(),
      storageGb: z.int().positive().optional(),
      extensions: z.array(KEY_SCHEMA).optional(),
      poolBudget: z.int().positive().optional(),
      readReplica: z.boolean().optional(),
    })
    .optional(),
  cache: z
    .strictObject({
      memoryMb: z.int().positive(),
      replicas: z.int().min(0).optional(),
      eviction: z.enum(Enum.values(CacheEviction) as [CacheEviction, ...CacheEviction[]]),
    })
    .optional(),
  buckets: z.record(KEY_SCHEMA, z.strictObject({ storageGb: z.int().positive() })).optional(),
  queues: z
    .record(
      KEY_SCHEMA,
      z.strictObject({
        visibilityTimeoutSeconds: z.int().positive(),
        dlq: z.boolean().optional(),
      }),
    )
    .optional(),
  crons: z.strictObject({ enabled: z.boolean() }).optional(),
  config: CONFIG_VALUES_SCHEMA.optional(),
});
