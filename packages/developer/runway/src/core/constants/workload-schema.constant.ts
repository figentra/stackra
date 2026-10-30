/**
 * Stackra file contract:
 * Purpose: `WORKLOAD_SCHEMA`, one container of the root runway's `workloads`: the image pinned by digest, its port and
 *          health path, `internal` or `public`, the resources it uses, its public env and secret NAMES, a size and a
 *          task count per environment, and the reason no managed option fits.
 * Boundary: internal; the root runway schema composes it, and checks `uses` against `resources`. Strict. An image tag
 *           can change under us, so a digest is required; `reason` is required (ADR 0493 decision 5). Env values are
 *           public; a secret goes in `secrets` by name.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decisions 1, 3, 4 and 5), ADR 0173 (secret names only).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { SIZE_BY_ENVIRONMENT_SCHEMA } from "#core/constants/size-by-environment-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** How many tasks run. */
const SCALE = z
  .strictObject({ min: z.int().min(0), max: z.int().min(1) })
  .refine((scale) => scale.min <= scale.max, { message: "min is above max", path: ["min"] });

/** One container workload. */
export const WORKLOAD_SCHEMA = z.strictObject({
  image: z
    .string()
    .regex(
      /^[^\s@]+@sha256:[a-f0-9]{64}$/,
      "Expected an image pinned by digest: <name>@sha256:<64 hex>",
    ),
  port: z.int().min(1).max(65_535),
  health: z.string().regex(/^\//, "Expected a path starting with /"),
  expose: z.enum(["internal", "public"]).optional(),
  uses: z.array(KEY_SCHEMA).optional(),
  env: z
    .record(z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE name"), z.string())
    .optional(),
  secrets: SECRET_NAMES_SCHEMA.optional(),
  size: SIZE_BY_ENVIRONMENT_SCHEMA.optional(),
  scale: z
    .partialRecord(
      z.enum(Enum.values(RunwayEnvironment) as [RunwayEnvironment, ...RunwayEnvironment[]]),
      SCALE,
    )
    .optional(),
  reason: z
    .string()
    .min(1, "A workload needs a reason: no managed option fits, residency, or on-prem parity"),
});
