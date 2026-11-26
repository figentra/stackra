/**
 * Stackra file contract:
 * Purpose: `CompileOptions`, what `compileMigration` needs besides the class: the module's Postgres schema, whether
 *          this migration creates it, the macros the migration may call, and whether the migration is frozen.
 * Boundary: a type only; gen fills it from the migration's path (the module key is the schema), the module's first
 *           migration, the macros of the member and of the packages it hosts, and the member's migration lock.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0294 and ADR 0305; ADR 0294 (decision 20: a schema per module);
 *                     STA-2160 (a frozen migration compiles under the authoring rules as warnings).
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

  /**
   * How a public-id key column is stored: `uuid` (owner decision 1, ADR 0135 as amended 2026-10-28; the model's
   * `PublicIdType`/`LinkType` codec adds and strips the prefix) or `varchar` (`varchar(33)`, the text form); `varchar`
   * when absent until gen's entities switch to the codec. It covers `hasPublicId`, `belongsTo` and `link`; principal
   * stamps and `scope_id` keep the text form.
   */
  readonly publicIds?: "uuid" | "varchar";

  /**
   * Whether the migration is frozen: locked in the member's committed `stackra.manifest.json`, so it may already be
   * applied (ADR 0159, STA-2160). A frozen migration compiles to the SQL it was locked with: an authoring rule that only
   * checks how it is written (every column states its nullability and has a comment) is reported in `warnings` instead
   * of refusing it, since a rule added after the lock cannot change what a database already ran. Every other rule still
   * refuses, and an unfrozen migration meets every rule.
   */
  readonly frozen?: boolean;
}
