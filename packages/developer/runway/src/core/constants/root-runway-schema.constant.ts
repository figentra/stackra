/**
 * Stackra file contract:
 * Purpose: `ROOT_RUNWAY_SCHEMA`, the repository's root `runway.yaml` at format version 3: the project, the providers
 *          and accounts, each environment (destinations, topology, defaults), the deploy targets (with the desktop
 *          update feed origin), the edge, the CI and gateway secret names, the release policy and observability.
 * Boundary: internal; `parseRunway("root", …)` and `runwayJsonSchema("root")` read it. Strict at the top so a misspelt
 *           section fails; provider, target, edge, release and observability blocks stay open, as their owners check
 *           them.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2), ADR 0168 (decisions 1 to 3 and 6), ADR 0173 (secret names only), ADR
 *                     0254 (the desktop feed).
 */
import { Enum } from "@stackra/contracts";
import { url } from "@stackra/validation";
import { z } from "zod";

import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { ROOT_ENVIRONMENT_SCHEMA } from "#core/constants/root-environment-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** An open block whose owner checks it. */
const OPEN = z.record(z.string(), z.unknown());

/** The root runway. */
export const ROOT_RUNWAY_SCHEMA = z.strictObject({
  $schema: z.string().optional(),
  version: z.literal(3),
  project: KEY_SCHEMA,
  providers: z.record(KEY_SCHEMA, OPEN).optional(),
  environments: z.partialRecord(
    z.enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]]),
    ROOT_ENVIRONMENT_SCHEMA,
  ),
  targets: z
    .looseObject({
      "electron-release": z
        .looseObject({ feed: z.looseObject({ publicOrigin: url() }).optional() })
        .optional(),
    })
    .optional(),
  edge: OPEN.optional(),
  secrets: z
    .object({ sync: z.string().min(1).optional(), defaultPath: z.string().min(1).optional() })
    .catchall(SECRET_NAMES_SCHEMA)
    .optional(),
  release: OPEN.optional(),
  observability: OPEN.optional(),
});
