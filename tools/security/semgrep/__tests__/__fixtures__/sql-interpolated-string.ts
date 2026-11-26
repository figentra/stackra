/**
 * Stackra file contract:
 * Purpose: Semgrep test fixture for `stackra.sql-interpolated-string` (`ruleid:` lines must match, `ok:` lines must not).
 * Boundary: never imported or run; `semgrep --test` reads it (`pnpm security:sast --test`).
 * Runtime: none
 * Governing contract: tools/security/semgrep/rules/sql-interpolated-string.yml; ADR 0187 decision 3; STA-2821.
 */
declare const sql: { query(text: string, values?: unknown[]): Promise<unknown[]> };
declare const db: { unsafe(text: string): Promise<unknown>; exec(text: string): Promise<void> };
declare const id: string;
declare const table: string;

export async function examples(): Promise<void> {
  // ruleid: stackra.sql-interpolated-string
  await sql.query(`select * from users where id = '${id}'`);
  // ruleid: stackra.sql-interpolated-string
  await db.unsafe(`DELETE FROM ${table} WHERE id = 1`);
  // ruleid: stackra.sql-interpolated-string
  await db.exec(`update users set name = '${id}' ` + "where true");
  // ruleid: stackra.sql-interpolated-string
  await sql.query(`
    insert into audit (actor) values ('${id}')`);

  // ok: stackra.sql-interpolated-string
  await sql.query("select * from users where id = ?", [id]);
  // ok: stackra.sql-interpolated-string
  await sql.query(`select * from users where id = ?`, [id]);
  // ok: stackra.sql-interpolated-string
  await db.exec(`git log ${id}`);
}
