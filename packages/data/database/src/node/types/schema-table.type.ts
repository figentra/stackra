/**
 * Stackra file contract:
 * Purpose: `SchemaTable`, one table of a `SchemaDescription`: its columns, primary key, indexes, row-level security
 *          (enabled, forced) and policies.
 * Boundary: a type only; plain JSON values.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); `.agents/rules/tenancy.md` (point 2); STA-2906.
 */
import type { SchemaColumn } from "#node/types/schema-column.type";
import type { SchemaPolicy } from "#node/types/schema-policy.type";

/** One table, as the catalogue describes it. */
export interface SchemaTable {
  /** Its schema, such as `notes`. */
  readonly schema: string;
  /** Its name. */
  readonly name: string;
  /** Its columns, in order. */
  readonly columns: readonly SchemaColumn[];
  /** The columns of its primary key, in order; empty without one. */
  readonly primaryKey: readonly string[];
  /** Each index with its definition. */
  readonly indexes: readonly { readonly name: string; readonly definition: string }[];
  /** Row-level security: `enabled` applies the policies, `forced` applies them to the owner as well. */
  readonly rowSecurity: { readonly enabled: boolean; readonly forced: boolean };
  /** Its policies. */
  readonly policies: readonly SchemaPolicy[];
}
