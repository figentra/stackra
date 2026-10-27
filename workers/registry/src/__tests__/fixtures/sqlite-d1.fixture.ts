/**
 * Stackra file contract:
 * Purpose: `sqliteD1()`, a D1 binding over an in-memory node:sqlite database with every file of `migrations/`
 *          applied in order, so the tests run the registry's real SQL and real schema.
 * Boundary: test fixture only; a batch is one transaction, as on D1.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 3).
 */
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import type { D1Database } from "#src/interfaces/d1-database.interface";
import type { D1Statement } from "#src/interfaces/d1-statement.interface";

const MIGRATIONS = new URL("../../../migrations/", import.meta.url);

/** A prepared statement over node:sqlite. */
class SqliteStatement implements D1Statement {
  readonly #db: DatabaseSync;
  readonly #sql: string;
  readonly #values: readonly SQLInputValue[];

  constructor(db: DatabaseSync, sql: string, values: readonly SQLInputValue[] = []) {
    this.#db = db;
    this.#sql = sql;
    this.#values = values;
  }

  bind(...values: readonly (string | number | null)[]): D1Statement {
    return new SqliteStatement(this.#db, this.#sql, values);
  }

  async first<T>(): Promise<T | null> {
    const row = this.#db.prepare(this.#sql).get(...this.#values);
    return row === undefined ? null : ({ ...row } as T);
  }

  async all<T>(): Promise<{ results: T[] }> {
    const rows = this.#db.prepare(this.#sql).all(...this.#values);
    return { results: rows.map((row) => ({ ...row }) as T) };
  }

  async run(): Promise<unknown> {
    return this.#db.prepare(this.#sql).run(...this.#values);
  }
}

/** The migrated in-memory database and its D1 binding. */
export function sqliteD1(): { readonly db: D1Database; readonly sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql"))
    .sort())
    sqlite.exec(readFileSync(new URL(file, MIGRATIONS), "utf8"));
  const db: D1Database = {
    prepare: (sql) => new SqliteStatement(sqlite, sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return { db, sqlite };
}
