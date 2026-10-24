/**
 * Stackra file contract:
 * Purpose: `ROOT_ENVIRONMENT_SCHEMA`, one `environments.<env>` block of the root runway: its destinations, its
 *          topology (required: the root decides placement for every environment), the defaults members start from,
 *          the dev lanes, and the environment's other provider facts (infra, shared pools, domains, deploy rule,
 *          release channels).
 * Boundary: internal. Loose beyond the typed keys: provider facts grow with the providers (ADR 0289), and the
 *           commands that read them check their own part. The topology is strict.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2), ADR 0289 (decisions 4 and 5), ADR 0170.
 */
import { z } from "zod";

import { CONFIG_VALUES_SCHEMA } from "#core/constants/config-values-schema.constant";
import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { TOPOLOGY_SCHEMA } from "#core/constants/topology-schema.constant";

/** One root environment. */
export const ROOT_ENVIRONMENT_SCHEMA = z.looseObject({
  destinations: z.record(KEY_SCHEMA, KEY_SCHEMA).optional(),
  topology: TOPOLOGY_SCHEMA,
  lanes: z
    .strictObject({
      enabled: z.boolean(),
      portStep: z.int().positive().optional(),
      from: z
        .string()
        .regex(/^[A-Z][A-Z0-9_]*$/, "Expected an environment variable name")
        .optional(),
    })
    .optional(),
  defaults: z
    .looseObject({
      service: z.looseObject({ config: CONFIG_VALUES_SCHEMA.optional() }).optional(),
      app: z.looseObject({ config: CONFIG_VALUES_SCHEMA.optional() }).optional(),
    })
    .optional(),
});
