/**
 * Stackra file contract:
 * Purpose: `ROOT_ENVIRONMENT_SCHEMA`, one `environments.<env>` block of the root runway: where each kind of member
 *          runs (`destinations`), the dev containers, lanes (with the repository index table `checkPorts` reads), https and proxy, the Encore environment, a preview's ttl
 *          and data, the shared resources, the defaults members start from, the topology, the domains, the deploy
 *          rule, the mobile and desktop channels, the regions it deploys to, in release order, the cloud its foundation
 *          runs on, and the dedicated deployments that ride its release train.
 * Boundary: internal. Strict at its top and in `shared` and `defaults.service`, as the canonical schema is; the
 *           provider facts inside stay open, and the commands that read them check their own part.
 * Runtime: isomorphic
 * Governing contract: ADR 0296; ADR 0493 (resources, workloads, limits, uses); (decision 2), ADR 0238 (one database server per environment), ADR 0170, ADR 0289,
 *                     ADR 0354 (decision 4); OS-12 (a release rolls region by region); ADR 0400 (`cloud`, `dedicated`); STA-863 (the
 *                     repository index table, redundancy challenge item 5).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { CONFIG_VALUES_SCHEMA } from "#core/constants/config-values-schema.constant";
import { DEDICATED_SCHEMA } from "#core/constants/dedicated-schema.constant";
import { ENVIRONMENT_CLOUD_SCHEMA } from "#core/constants/environment-cloud-schema.constant";
import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";
import { TOPOLOGY_SCHEMA } from "#core/constants/topology-schema.constant";
import { DeployKind } from "#core/enums/deploy-kind.enum";

/** One root environment. */
export const ROOT_ENVIRONMENT_SCHEMA = z.strictObject({
  destinations: z
    .partialRecord(z.enum(Enum.values(DeployKind) as [DeployKind, ...DeployKind[]]), z.string())
    .optional(),
  infra: z.record(z.string(), OPEN_OBJECT_SCHEMA).optional(),
  lanes: z
    .looseObject({
      enabled: z.boolean().optional(),
      portStep: z.int().min(1).optional(),
      from: z.string().optional(),
      repos: z
        .record(KEY_SCHEMA, z.int().min(0))
        .refine(
          (repos) => new Set(Object.values(repos)).size === Object.keys(repos).length,
          "Two repositories share an index",
        )
        .optional(),
      worktrees: z.int().min(1).optional(),
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
  // ADR 0493 decision 3: the plan's monthly estimate cap in US dollars; no cap only warns.
  limits: z.strictObject({ monthly: z.number().positive() }).optional(),
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
  regions: z
    .array(z.string())
    .refine((keys) => new Set(keys).size === keys.length, "A region is listed more than once")
    .optional(),
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
  cloud: ENVIRONMENT_CLOUD_SCHEMA.optional(),
  dedicated: z
    .record(z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case key"), DEDICATED_SCHEMA)
    .optional(),
});
