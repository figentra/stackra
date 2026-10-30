/**
 * Stackra file contract:
 * Purpose: `RESOURCE_SCHEMA`, one managed resource of the root runway's `resources`: its kind, the Postgres engine and
 *          version, a size per environment and an optional reason.
 * Boundary: internal; the root runway schema composes it. Strict. The engine is Postgres's alone. A kind outside
 *           `ResourceKind` (Kafka, OpenSearch, SES are reserved) is refused naming ADR 0493.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decisions 1, 3 and 5), ADR 0238 (RDS by default, Aurora optional).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { SIZE_BY_ENVIRONMENT_SCHEMA } from "#core/constants/size-by-environment-schema.constant";
import { ResourceKind } from "#core/enums/resource-kind.enum";

/** One managed resource. */
export const RESOURCE_SCHEMA = z
  .strictObject({
    kind: z.enum(Enum.values(ResourceKind) as [ResourceKind, ...ResourceKind[]], {
      error: `Expected ${Enum.values(ResourceKind).join(", ")}; kafka, opensearch and ses are reserved (ADR 0493)`,
    }),
    engine: z.enum(["rds", "aurora"]).optional(),
    version: z
      .string()
      .regex(/^[0-9]+(\.[0-9]+)?$/, "Expected a major version such as 17")
      .optional(),
    size: SIZE_BY_ENVIRONMENT_SCHEMA.optional(),
    reason: z.string().min(1).optional(),
  })
  .refine(
    (resource) =>
      resource.kind === ResourceKind.Postgres ||
      (resource.engine === undefined && resource.version === undefined),
    { message: "engine and version are Postgres options", path: ["engine"] },
  );
