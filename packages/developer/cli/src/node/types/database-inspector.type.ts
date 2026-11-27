/**
 * Stackra file contract:
 * Purpose: `DatabaseInspector`, what the `stackra db:schema`, `db:query` and `db:migrations:status` commands call in
 *          the member's `@stackra/database/node`: `describeSchema`, `queryInScope` and `migrationStatus`, each
 *          answering a plain JSON document (the command's `--json` data and the MCP tool's structured result).
 * Boundary: type only. The CLI declares the shape it reads and imports the module from the member at run time, so the
 *           CLI never bundles or depends on MikroORM; the answers' full shapes are the database package's types.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); STA-2906.
 */

/** The environment an inspection reads its connection and environment name from. */
type InspectionEnv = Readonly<Record<string, string | undefined>>;

/** The developer database inspections of one member. */
export type DatabaseInspector = {
  /** The member's tables with their columns, keys, row-level security and policies. */
  readonly describeSchema: (options: {
    readonly schema?: string | undefined;
    readonly table?: string | undefined;
    readonly env: InspectionEnv;
  }) => Promise<{
    readonly environment: string;
    readonly role: string;
    readonly tables: readonly {
      readonly schema: string;
      readonly name: string;
      readonly columns: readonly unknown[];
      readonly rowSecurity: { readonly enabled: boolean; readonly forced: boolean };
      readonly policies: readonly unknown[];
    }[];
  }>;

  /** One query read as the app's role under an explicit tenant, read-only and bounded. */
  readonly queryInScope: (query: {
    readonly sql: string;
    readonly scope: string;
    readonly role?: string | undefined;
    readonly limit?: number | undefined;
    readonly timeoutMs?: number | undefined;
    readonly env: InspectionEnv;
  }) => Promise<{
    readonly role: string;
    readonly scope: string;
    readonly columns: readonly string[];
    readonly rows: readonly Readonly<Record<string, unknown>>[];
    readonly rowCount: number;
    readonly truncated: boolean;
  }>;

  /** The compiled migration files against the database's recorded version, read-only. */
  readonly migrationStatus: (options: {
    readonly cwd: string;
    readonly env: InspectionEnv;
  }) => Promise<{
    readonly version: number;
    readonly dirty: boolean;
    readonly pending: number;
    readonly migrations: readonly {
      readonly name: string;
      readonly applied: boolean;
      readonly edited: boolean;
    }[];
  }>;
};
