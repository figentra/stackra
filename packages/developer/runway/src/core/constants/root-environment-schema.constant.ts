/**
 * Stackra file contract:
 * Purpose: `ROOT_ENVIRONMENT_SCHEMA`, one `environments.<env>` block of the root runway: where each kind of member
 *          runs (`destinations`), the dev containers, lanes, https and proxy, the Encore environment, a preview's ttl
 *          and data, the shared resources, the defaults members start from, the topology, the domains, the deploy
 *          rule and the mobile and desktop channels.
 * Boundary: internal. Strict at its top and in `shared` and `defaults.service`, as the canonical schema is; the
 *           provider facts inside stay open, and the commands that read them check their own part.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2), ADR 0238 (one database server per environment), ADR 0170, ADR 0289.
 */
import { z } from "zod";

import { CONFIG_VALUES_SCHEMA } from "#core/constants/config-values-schema.constant";
import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";
import { TOPOLOGY_SCHEMA } from "#core/constants/topology-schema.constant";

/** One root environment. */
export const ROOT_ENVIRONMENT_SCHEMA = z.strictObject({
  destinations: z
    .partialRecord(z.enum(["services", "web", "mobile", "desktop", "docs"]), z.string())
    .optional(),
  infra: z.record(z.string(), OPEN_OBJECT_SCHEMA).optional(),
  lanes: z
    .looseObject({
      enabled: z.boolean().optional(),
      portStep: z.int().min(1).optional(),
      from: z.string().optional(),
    })
    .optional(),
  https: OPEN_OBJECT_SCHEMA.optional(),
  proxy: OPEN_OBJECT_SCHEMA.optional(),
  encore: OPEN_OBJECT_SCHEMA.optional(),
  ttl: z
    .string()
    .regex(/^[0-9]+[hd]$/, "Expected a duration such as 12h or 7d")
    .optional(),
  data: z.string().optional(),
  shared: z
    .strictObject({
      network: OPEN_OBJECT_SCHEMA.optional(),
      database: OPEN_OBJECT_SCHEMA.optional(),
      cache: OPEN_OBJECT_SCHEMA.optional(),
      queues: OPEN_OBJECT_SCHEMA.optional(),
      buckets: OPEN_OBJECT_SCHEMA.optional(),
    })
    .optional(),
  defaults: z
    .strictObject({
      service: z
        .strictObject({
          database: z.strictObject({ poolBudget: z.int().min(1).optional() }).optional(),
          config: CONFIG_VALUES_SCHEMA.optional(),
        })
        .optional(),
      app: OPEN_OBJECT_SCHEMA.optional(),
    })
    .optional(),
  topology: TOPOLOGY_SCHEMA.optional(),
  domains: z
    .looseObject({
      zone: z.string().optional(),
      pattern: z.string().optional(),
      tenantDomains: z.string().optional(),
    })
    .optional(),
  deploy: z
    .looseObject({
      on: z.enum(["pull-request", "merge-to-main", "promote"]).optional(),
      gate: z.string().optional(),
      approval: z.string().optional(),
    })
    .optional(),
  mobile: z.looseObject({ channel: z.string().optional() }).optional(),
  desktop: z.looseObject({ channel: z.string().optional() }).optional(),
});
