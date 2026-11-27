/**
 * Stackra file contract:
 * Purpose: `SchemaDescription`, what `describeSchema` answers: the environment, the role that read the catalogue, and
 *          each table with its columns, primary key, indexes, row-level security (enabled, forced) and policies, so a
 *          developer or an agent sees why a read under a tenant returns the rows it does.
 * Boundary: a type only; plain JSON values, so it is the `--json` document of `stackra db:schema` and the MCP tool's
 *           structured result as it is.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); `.agents/rules/tenancy.md` (point 2); STA-2906.
 */
import type { SchemaTable } from "#node/types/schema-table.type";

/** The answer of `describeSchema`. */
export interface SchemaDescription {
  /** The environment it read (`dev` or `test`). */
  readonly environment: string;
  /** The role that read the catalogue. */
  readonly role: string;
  /** The tables, by schema and name. */
  readonly tables: readonly SchemaTable[];
}
