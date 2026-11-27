/**
 * Stackra file contract:
 * Purpose: `postgresFault(options)`, the fault-injection tier's database fault: the SQL of a row trigger that fails
 *          the chosen writes of one table (after `skip` pass, the next `times` fail with `sqlstate`), so an
 *          integration test can make the database refuse exactly the write an at-least-once path records its outcome
 *          with, on a real Postgres.
 * Boundary: pure: it builds statements and runs nothing; the test runs them through its own connection (a superuser
 *           or the table's owner). The counter is a sequence, which a rollback does not undo, so a write that fails
 *           inside a transaction still counts. The trigger function is `security definer` with an empty search path,
 *           so the service role under test needs no grant on the counter. Every identifier is checked to be
 *           snake_case and the SQLSTATE five characters, so nothing from a test reaches the SQL unquoted.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection; decision 3: Postgres in the integration tier); ADR 0269
 *                     (decision 2: generic kit).
 */
import type { PostgresFault } from "#core/types/postgres-fault.type";
import type { PostgresFaultOptions } from "#core/types/postgres-fault-options.type";
import type { PostgresWrite } from "#core/types/postgres-write.type";

/** A snake_case SQL identifier. */
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/u;

/** A SQLSTATE: five digits or capital letters. */
const SQLSTATE = /^[0-9A-Z]{5}$/u;

/**
 * `value` checked as a whole number of at least `min`.
 *
 * @throws RangeError otherwise.
 */
function wholeFrom(name: string, value: number, min: number): number {
  if (!Number.isInteger(value) || value < min)
    throw new RangeError(`postgresFault: ${name} is a whole number from ${min}, got ${value}`);
  return value;
}

/**
 * `value` checked as a snake_case identifier.
 *
 * @throws TypeError otherwise.
 */
function identifier(what: string, value: string): string {
  if (!IDENTIFIER.test(value))
    throw new TypeError(`postgresFault: ${what} "${value}" is not a snake_case identifier`);
  return value;
}

/**
 * The SQL that makes the chosen row writes of a table fail.
 *
 * @param options - the fault: its name, table, writes, how many pass, how many fail, and the SQLSTATE.
 * @returns the statements that install and remove it, and the message a failed write raises.
 * @throws TypeError when the name or the table is not snake_case (`schema.table`), or the SQLSTATE is not five
 *         characters, or `on` is empty.
 * @throws RangeError when `skip` is not a whole number from 0 or `times` not one from 1.
 * @example
 * // the first delete of a job row fails, as if the connection dropped as the worker recorded the outcome
 * const fault = postgresFault({ name: "job_remove", table: "queue.jobs", on: "delete" });
 * for (const sql of fault.install) await superuser(sql);
 */
export function postgresFault(options: PostgresFaultOptions): PostgresFault {
  const name = identifier("name", options.name);
  const [schema = "", table = "", ...extra] = options.table.split(".");
  if (extra.length > 0 || table === "")
    throw new TypeError(`postgresFault: table "${options.table}" is not schema.table`);
  identifier("schema", schema);
  identifier("table", table);
  const sqlstate = options.sqlstate ?? "08006";
  if (!SQLSTATE.test(sqlstate))
    throw new TypeError(`postgresFault: sqlstate "${sqlstate}" is not five digits or capitals`);
  const writes: readonly PostgresWrite[] = [options.on].flat();
  if (writes.length === 0) throw new TypeError("postgresFault: on names no write");
  const skip = wholeFrom("skip", options.skip ?? 0, 0);
  const times = wholeFrom("times", options.times ?? 1, 1);
  const base = `stackra_fault_${name}`;
  const counter = `"${schema}"."${base}_seq"`;
  const fn = `"${schema}"."${base}"`;
  const target = `"${schema}"."${table}"`;
  const message = `injected fault: ${name}`;
  return Object.freeze({
    install: Object.freeze([
      `create sequence ${counter}`,
      [
        `create function ${fn}() returns trigger language plpgsql security definer set search_path = '' as $fault$`,
        "declare",
        `  n bigint := nextval('${counter}');`,
        "begin",
        `  if n > ${skip} and n <= ${skip + times} then`,
        `    raise exception '${message}' using errcode = '${sqlstate}';`,
        "  end if;",
        "  if tg_op = 'DELETE' then return old; end if;",
        "  return new;",
        "end",
        "$fault$",
      ].join("\n"),
      `create trigger "${base}" before ${[...new Set(writes)].join(" or ")} on ${target} for each row execute function ${fn}()`,
    ]),
    remove: Object.freeze([
      `drop trigger if exists "${base}" on ${target}`,
      `drop function if exists ${fn}()`,
      `drop sequence if exists ${counter}`,
    ]),
    message,
  });
}
