/**
 * Stackra file contract:
 * Purpose: `CompileOptions`, what `compileMigration` needs besides the class: the module's Postgres schema, whether
 *          this migration creates it, and the macros the migration may call.
 * Boundary: a type only; gen fills it from the migration's path (the module key is the schema), the module's first
 *           migration, and the macros of the member and of the packages it hosts.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0294 and ADR 0305; ADR 0294 (decision 20: a schema per module).
 */
import type { MacroClass } from "#core/types/macro-class.type";

/** The compile options. */
export interface CompileOptions {
  /** The module's Postgres schema (`orders`); every table name is relative to it. */
  readonly schema: string;

  /** Whether the step creates the schema first: true for the module's first migration. */
  readonly createsSchema?: boolean;

  /** The macros installed on every blueprint, by the name their class gives. */
  readonly macros?: readonly MacroClass[];
}
