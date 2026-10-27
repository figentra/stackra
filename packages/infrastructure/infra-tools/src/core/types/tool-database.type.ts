/**
 * Stackra file contract:
 * Purpose: `ToolDatabase`, one tool's logical database on the environment's shared Postgres server (ADR 0238): the
 *          database and its owning role (same name), the extensions the admin creates in it, and the parameter that
 *          holds the role's password.
 * Boundary: type only; plain data `toolsStackPlan` derives from the catalogue's `database` field. The tool's own
 *           connection URL secret must carry the same password; Infisical holds both (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0444; ADR 0238 (one server per environment, one database and role per service); ADR 0173.
 */

/** One tool's database. */
export type ToolDatabase = {
  /** The tool's catalogue key. */
  readonly tool: string;
  /** The database name, which is also its owning role's name. */
  readonly name: string;
  /** Extensions created in the database by the admin (`pg_trgm`, `vector`). */
  readonly extensions: readonly string[];
  /** The parameter (`<secretsPath>/<tool>/DATABASE_PASSWORD`) that holds the role's password. */
  readonly passwordParameter: string;
};
