/**
 * Stackra file contract:
 * Purpose: `RUNWAY_MIGRATIONS_FILE_SCHEMA`, the `runway.migrations/v1` record `runway migrations:record` writes after a
 *          deploy succeeded: the environment, the full commit it deployed and the `<member>:<id>` key of every
 *          migration it applied. `runway evidence --previous` reads it back.
 * Boundary: a zod schema, data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0533 (decision 3); ADR 0159 (decision 3); STA-2866.
 */
import { z } from "zod";

/** A `runway-migrations` record. */
export const RUNWAY_MIGRATIONS_FILE_SCHEMA = z.object({
  schema: z.literal("runway.migrations/v1"),
  environment: z.string(),
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  migrations: z.array(z.string()),
});
