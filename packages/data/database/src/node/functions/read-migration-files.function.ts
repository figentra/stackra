/**
 * Stackra file contract:
 * Purpose: `readMigrationFiles(directory)`, the compiled migration files of a member in apply order: each
 *          `<seq>_<name>.up.sql` with its `.down.sql` inverse (when gen wrote one) and whether it runs in a transaction.
 * Boundary: reads the folder and nothing else. A file is non-transactional when its first line is
 *           `-- stackra:transactional=false`. The batch of a file is its name without the sequence and without a
 *           trailing step number, so the steps of one migration revert together.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended 2026-10-24: the `N_name.up.sql` numbering).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** One compiled step file. */
export interface MigrationFile {
  /** The sequence number: the `schema_migrations.version` it sets. */
  readonly version: number;

  /** The file name without `.up.sql`. */
  readonly name: string;

  /** The migration it belongs to: the name without the sequence and the trailing step number. */
  readonly batch: string;

  /** Whether the runner wraps it in one transaction. */
  readonly transactional: boolean;

  /** The statement text. */
  readonly sql: string;

  /** The inverse text, or `undefined` when the step is irreversible. */
  readonly inverse: string | undefined;
}

/**
 * Lists the folder's migration files in sequence order.
 *
 * @param directory - the folder gen wrote the `.up.sql` files to.
 * @throws Error when the folder is missing or two files share a sequence number.
 * @example
 * readMigrationFiles(".stackra/migrations")[0]?.name; // "0001_database_0001_create_sequence_tables"
 */
export function readMigrationFiles(directory: string): readonly MigrationFile[] {
  if (!existsSync(directory)) throw new Error(`${directory} does not exist: run stackra gen first`);
  const files = readdirSync(directory)
    .map((file) => /^(\d+)_(.+)\.up\.sql$/.exec(file))
    .filter((match) => match !== null)
    .map((match): MigrationFile => {
      const [file, sequence = "", name = ""] = match;
      const down = join(directory, file.replace(/\.up\.sql$/, ".down.sql"));
      const sql = readFileSync(join(directory, file), "utf8");
      return {
        version: Number(sequence),
        name: file.replace(/\.up\.sql$/, ""),
        batch: name.replace(/_\d+$/, ""),
        transactional: !sql.startsWith("-- stackra:transactional=false"),
        sql,
        inverse: existsSync(down) ? readFileSync(down, "utf8") : undefined,
      };
    })
    .sort((a, b) => a.version - b.version);
  for (const [index, file] of files.entries()) {
    if (files[index - 1]?.version === file.version)
      throw new Error(`two migration files share sequence ${file.version}: ${file.name}`);
  }
  return files;
}
