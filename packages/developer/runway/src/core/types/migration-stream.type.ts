/**
 * Stackra file contract:
 * Purpose: `MigrationStream`, one service's compiled migrations as a deploy ships them: the member, gen's classified
 *          migrations from `.stackra/migration-safety.json` (`undefined` when the file is missing or does not parse)
 *          and the step files in `.stackra/migrations`.
 * Boundary: data only; read by `readMigrationStreams`, judged by `streamIsCurrent` and `destructiveOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3); ADR 0533 (decision 3); STA-2866.
 */
import type { z } from "zod";

import type { MIGRATION_SAFETY_FILE_SCHEMA } from "#core/constants/migration-safety-file-schema.constant";

/** One service's compiled migrations. */
export interface MigrationStream {
  /** The member folder name (`billing` for `services/billing`). */
  readonly member: string;

  /** gen's classified migrations, or `undefined` when the safety file is missing or unreadable. */
  readonly safety: z.infer<typeof MIGRATION_SAFETY_FILE_SCHEMA> | undefined;

  /** The `.up.sql` step files in `.stackra/migrations`, without the suffix. */
  readonly compiled: readonly string[];
}
