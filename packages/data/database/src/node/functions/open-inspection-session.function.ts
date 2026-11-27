/**
 * Stackra file contract:
 * Purpose: `openInspectionSession(url, run)`, the connection a developer inspection reads through: one pooled
 *          connection to `url`, a READ ONLY transaction opened before `run` and always rolled back after it, then the
 *          connection closed. The session's `extended` runs a caller's statement on the extended protocol, so a second
 *          statement after a `;` is a syntax error instead of a statement that runs after the transaction ends.
 * Boundary: the only inspection file that connects. Writes nothing: the transaction is read-only and rolled back, so
 *           even a function with a side effect cannot keep one. The URL comes from `inspectionTarget`, never from a
 *           caller's argument. Session settings an inspection sets are `local` and end with the transaction.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); ADR 0097 (MikroORM only here); STA-2906.
 */
import { MikroORM } from "@mikro-orm/postgresql";

import type { InspectionRow } from "#node/types/inspection-row.type";
import type { InspectionSession } from "#node/types/inspection-session.type";

/** The compiled query Kysely's `executeQuery` takes. */
type CompiledQuery = Parameters<
  ReturnType<ReturnType<MikroORM["em"]["getConnection"]>["getClient"]>["executeQuery"]
>[0];

/**
 * Opens a read-only session for `run`.
 *
 * @param url - the connection string `inspectionTarget` returned.
 * @throws Error when Postgres refuses the connection, or whatever `run` throws (after the rollback).
 * @example
 * await openInspectionSession(url, (session) => session.execute("select 1 as one"));
 */
export async function openInspectionSession<T>(
  url: string,
  run: (session: InspectionSession) => Promise<T>,
): Promise<T> {
  const orm = await MikroORM.init({
    clientUrl: url,
    entities: [],
    discovery: { warnWhenNoEntities: false },
    // one connection, so the transaction, `set local` and the caller's statement share one backend
    pool: { min: 1, max: 1 },
    allowGlobalContext: true,
  });
  const connection = orm.em.getConnection();
  try {
    // raw-sql: the inspection's own transaction control on its one connection
    await connection.execute("begin transaction read only");
    try {
      return await run({
        execute: async (sql) =>
          (await connection.execute<InspectionRow[]>(sql)) as readonly InspectionRow[],
        extended: async (sql, params) => {
          // Kysely hands `sql` and the parameters to pg as they are; pg sends a statement with parameters on the
          // extended protocol, which accepts exactly one statement.
          const compiled = {
            sql,
            parameters: [...params],
            query: { kind: "RawNode", sqlFragments: [sql], parameters: [] },
            queryId: { queryId: "stackra-inspection" },
          } as unknown as CompiledQuery;
          const result = await connection.getClient().executeQuery(compiled);
          return result.rows as readonly InspectionRow[];
        },
      });
    } finally {
      // raw-sql: an inspection never keeps anything, and a failed statement left the transaction aborted
      await connection.execute("rollback");
    }
  } finally {
    await orm.close(true);
  }
}
