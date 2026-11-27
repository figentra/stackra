/**
 * Stackra file contract:
 * Purpose: `MIGRATION_SAFETY_FILE_SCHEMA`, the part of gen's `.stackra/migration-safety.json`
 *          (`stackra.migration-safety/v1`) that `runway evidence` reads: each migration's id, whether its ADR 0159
 *          class is destructive, and the compiled step files it became.
 * Boundary: validation only; extra keys (the class, findings, owner, file) pass through unread. A file that does not
 *           parse is unknown to the caller, never an empty stream.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3); ADR 0533 (decision 3); STA-2866.
 */
import { z } from "zod";

/** gen's migration safety file, as runway reads it. */
export const MIGRATION_SAFETY_FILE_SCHEMA = z.object({
  schema: z.literal("stackra.migration-safety/v1"),
  migrations: z.array(
    z.object({
      id: z.string().min(1),
      destructive: z.boolean(),
      files: z.array(z.string().min(1)),
    }),
  ),
});
