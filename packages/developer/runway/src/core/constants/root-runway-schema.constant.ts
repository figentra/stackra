/**
 * Stackra file contract:
 * Purpose: `ROOT_RUNWAY_SCHEMA`, the repository's root `runway.yaml` at format version 3: the project, the product (an edition's base), the providers
 *          and accounts, each environment (destinations, shared resources, defaults, topology), the deploy targets,
 *          the edge, the secret defaults with the CI and gateway secret names, the release policy and observability.
 * Boundary: internal; `parseRunway("root", …)` and `runwayJsonSchema("root")` read it, and it accepts what the
 *           canonical `tools/schemas/runway-root.schema.json` accepts. Strict at the top and in `secrets`, so a
 *           misspelt section fails; providers, targets, the edge, release and observability stay open, as their
 *           owners check them (`definesFor` reads `targets.electron-release.feed.publicOrigin` itself).
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2 and its 2026-10-24 note), ADR 0168 (decisions 1 to 3 and 6), ADR 0171
 *                     (`ref:` values), ADR 0173 (secret names only), ADR 0237 (gateway secret names), ADR 0335 (decision 2: product).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";
import { ROOT_ENVIRONMENT_SCHEMA } from "#core/constants/root-environment-schema.constant";
import { PRODUCT_SCHEMA } from "#core/constants/product-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** A runway environment name. */
const ENVIRONMENT = z.enum(
  Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]],
);

/** A public value, or `ref:<path>` resolved from the stacks repository at infra time. */
const VALUE = z.union([z.string(), z.number(), z.boolean()]);

/** The root runway. */
export const ROOT_RUNWAY_SCHEMA = z.strictObject({
  $schema: z.string().optional(),
  version: z.literal(3),
  project: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case project name"),
  product: PRODUCT_SCHEMA.optional(),
  providers: z
    .object({
      aws: z
        .looseObject({
          region: z.string().optional(),
          accounts: z.record(z.string(), VALUE).optional(),
          state: OPEN_OBJECT_SCHEMA.optional(),
          ecr: OPEN_OBJECT_SCHEMA.optional(),
          budgets: OPEN_OBJECT_SCHEMA.optional(),
          requiredTags: z.array(z.string()).optional(),
        })
        .optional(),
      encore: z.looseObject({ app: z.string().optional() }).optional(),
      cloudflare: z
        .looseObject({
          accountId: VALUE.optional(),
          zones: z.record(z.string(), VALUE).optional(),
        })
        .optional(),
      github: OPEN_OBJECT_SCHEMA.optional(),
      infisical: z
        .looseObject({
          domain: z
            .string()
            .regex(/^https:\/\//, "Expected an https:// URL")
            .optional(),
          workspace: VALUE.optional(),
          environments: z.partialRecord(ENVIRONMENT, z.string()).optional(),
          paths: z
            .record(z.string(), z.string().regex(/^\//, "Expected a path starting with /"))
            .optional(),
        })
        .optional(),
    })
    .catchall(OPEN_OBJECT_SCHEMA)
    .optional(),
  environments: z.partialRecord(ENVIRONMENT, ROOT_ENVIRONMENT_SCHEMA),
  targets: z.record(z.string(), OPEN_OBJECT_SCHEMA).optional(),
  edge: OPEN_OBJECT_SCHEMA.optional(),
  secrets: z
    .strictObject({
      sync: z.enum(["on-deploy"]).optional(),
      defaultPath: z.string().optional(),
      ci: SECRET_NAMES_SCHEMA.optional(),
      gateway: SECRET_NAMES_SCHEMA.optional(),
    })
    .optional(),
  release: OPEN_OBJECT_SCHEMA.optional(),
  observability: OPEN_OBJECT_SCHEMA.optional(),
});
