/**
 * Stackra file contract:
 * Purpose: `UsePostgresOptions`, what `usePostgres(options)` takes: the image, the entities, and the compiled
 *          migrations to apply.
 * Boundary: a type only. Without migrations the schema is created from the entity metadata, which has no column
 *           comments and no row-level-security policies; an isolation test passes the compiled migrations.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0182 (the integration tier); ADR 0159; gap db19 (stackra-284).
 */
import type { EntitySchema } from "@mikro-orm/core";

import type { CompiledMigration } from "#core/types/compiled-migration.type";

/** The fixture options. */
export interface UsePostgresOptions {
  /**
   * The Postgres image; when absent, the Stackra test image (PostGIS 3.6 on Postgres 18 with pgvector), built once per
   * process.
   */
  readonly image?: string;

  /** The entity schemas; the registered ones when absent. */
  readonly entities?: readonly EntitySchema[];

  /** Compiled migrations to apply in order; when absent the schema is created from the entities. */
  readonly migrations?: readonly CompiledMigration[];

  /**
   * A folder of compiled migration files (`.stackra/migrations`, written by `stackra gen`), applied in sequence order
   * after `migrations`; a service's generated isolation test passes its own (stackra-258).
   */
  readonly migrationsDirectory?: string;
}
