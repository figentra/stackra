/**
 * Stackra file contract:
 * Purpose: `GuideModule`, one module of a task guide's examples for `connectGuideDatabase`: its Postgres schema, its
 *          migrations in order and the macros they call.
 * Boundary: test support only, under `scripts/guides`; a type.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159; STA-2843.
 */
import type { MacroClass, MigrationClass } from "@stackra/database";

/** One guide module's migrations, in order, and the macros they call. */
export interface GuideModule {
  /** The module's Postgres schema (`projects`). */
  readonly schema: string;

  /** Its migrations, oldest first; the first creates the schema. */
  readonly migrations: readonly MigrationClass[];

  /** The macros the migrations call (`t.belongsToTenant()`, `t.searchable(...)`). */
  readonly macros?: readonly MacroClass[];
}
