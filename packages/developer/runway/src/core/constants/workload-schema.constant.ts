/**
 * Stackra file contract:
 * Purpose: `WORKLOAD_SCHEMA`, one container of the root runway's `workloads`: the image pinned by digest, its port and
 *          health path (or, for a worker with no port, the command that checks it), the arguments it starts with,
 *          `internal` or `public`, the resources it uses, its public env, secret NAMES and the names it reads a resource
 *          variable under, a size and a task count per environment, the one-off `migrate` command run before each
 *          rollout, and the reason no managed option fits.
 * Boundary: internal; the root runway schema composes it, and checks `uses` against `resources`. Strict. An image tag
 *           can change under us, so a digest is required; `reason` is required (ADR 0493 decision 5). A public
 *           workload needs a port and a health path, which its load balancer uses; a health path needs a port; an
 *           internal one may have neither (a queue worker such as Sidekiq). Env values are
 *           public; a secret goes in `secrets` by name. Whether an `aliases` target is a variable of a resource the
 *           workload uses is checked where the plan names the variables (`runtimePlan`, infra-aws-runtime).
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decisions 1, 3, 4 and 5), ADR 0173 (secret names only).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { KEY_SCHEMA } from "#core/constants/key-schema.constant";
import { SIZE_BY_ENVIRONMENT_SCHEMA } from "#core/constants/size-by-environment-schema.constant";
import { SECRET_NAMES_SCHEMA } from "#core/constants/secret-names-schema.constant";
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** A SCREAMING_SNAKE variable name. */
const VARIABLE = z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE name");

/** The longest a `migrate` task may run: a migration past an hour belongs in its own maintenance window. */
const MIGRATE_TIMEOUT_MAX_MINUTES = 60;

/** How many tasks run. */
const SCALE = z
  .strictObject({ min: z.int().min(0), max: z.int().min(1) })
  .refine((scale) => scale.min <= scale.max, { message: "min is above max", path: ["min"] });

/** One container workload. */
export const WORKLOAD_SCHEMA = z
  .strictObject({
    image: z
      .string()
      .regex(
        /^[^\s@]+@sha256:[a-f0-9]{64}$/,
        "Expected an image pinned by digest: <name>@sha256:<64 hex>",
      ),
    port: z.int().min(1).max(65_535).optional(),
    health: z.string().regex(/^\//, "Expected a path starting with /").optional(),
    /** A worker's own health check: the command the container runs, healthy when it exits 0 (`["pgrep", "-f", "sidekiq"]`). */
    healthCommand: z.array(z.string().min(1)).min(1).optional(),
    /** The container's arguments, replacing the image's default command (ZITADEL starts with `start-from-init …`). */
    command: z.array(z.string().min(1)).min(1).optional(),
    /**
     * A one-off task run with the same image, env, secrets and resources before each rollout (Chatwoot's
     * `db:chatwoot_prepare`); the rollout waits for it and stops when it fails. `timeoutMinutes` defaults to the plan's.
     */
    migrate: z
      .strictObject({
        command: z.array(z.string().min(1)).min(1),
        timeoutMinutes: z.int().min(1).max(MIGRATE_TIMEOUT_MAX_MINUTES).optional(),
      })
      .optional(),
    expose: z.enum(["internal", "public"]).optional(),
    uses: z.array(KEY_SCHEMA).optional(),
    env: z.record(VARIABLE, z.string()).optional(),
    secrets: SECRET_NAMES_SCHEMA.optional(),
    /** The name the image reads → a variable of a resource it uses (`ZITADEL_DATABASE_POSTGRES_DSN: MAIN_DB_URL`). */
    aliases: z.record(VARIABLE, VARIABLE).optional(),
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
  })
  .superRefine((workload, context) => {
    // its load balancer forwards to the port and checks the path
    if (workload.expose === "public") {
      if (workload.port === undefined)
        context.addIssue({
          code: "custom",
          path: ["port"],
          message: "A public workload needs a port",
        });
      if (workload.health === undefined)
        context.addIssue({
          code: "custom",
          path: ["health"],
          message: "A public workload needs a health path",
        });
    }
    if (workload.health !== undefined && workload.port === undefined)
      context.addIssue({ code: "custom", path: ["health"], message: "A health path needs a port" });
  });
