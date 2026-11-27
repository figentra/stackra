/**
 * Stackra file contract:
 * Purpose: `classifyMigrationStatement`, the ADR 0159 class of one compiled migration statement with its reason:
 *          `additive` adds or relaxes (a new table, column or object, an index on a new table, a NOT VALID
 *          constraint, a comment, a grant, a dropped constraint or default), `online` runs without blocking writes (a
 *          concurrent index build, an index drop, a constraint validation, a concurrent reindex or refresh), `contract`
 *          removes or narrows what the running release uses (a dropped table, column, function, policy or trigger, a
 *          rename, `SET NOT NULL`, a type change, a NOT NULL column without a default, a constraint checked under a
 *          lock) and `banned` never belongs in a migration (a data write, an index built on an existing table without
 *          `CONCURRENTLY`, a lock, a vacuum, a table rewrite). A statement on a table the same migration created with a
 *          plain `CREATE TABLE` is `additive`, since no release reads that table yet; `CREATE TABLE IF NOT EXISTS`
 *          may adopt a table that already exists, so it marks nothing created. A statement gen cannot read counts as
 *          `contract`, so an unknown is destructive; so does a string that holds more than one top-level statement
 *          (`splitSqlStatements`), which `classifyMigrations` splits before it asks.
 * Boundary: pure; reads the SQL text only. Keywords are matched on `sqlCodeOf`'s code: every comment (inline and
 *           block ones included) dropped, literals and dollar-quoted bodies blanked and quoted identifiers masked, so a
 *           function body, a comment or a quoted word never changes the class. A `SELECT` or `WITH` read is
 *           `additive` only when it calls no function outside `READ_ONLY_CALLS` (any other may write, so it is
 *           `contract`) and creates no table (`SELECT … INTO` copies rows, `banned`). A `DO` block is judged by its
 *           body: only reads and raises that call no other function are `additive`, a data write is `banned`,
 *           anything else (a body that is no dollar-quoted one included) `contract`.
 *           `CREATE TABLE … AS` copies rows (`banned`) unless it is empty or temporary; a temporary one and
 *           `CREATE MATERIALIZED VIEW … AS` are judged by their query like a read.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (decision 3; the 2026-10-23 note: Additive, Online, Contract and Banned); ADR 0334
 *                     (rule 4: no data change in a migration).
 */
import { migrationSafetyRank } from "#core/functions/migration-safety-rank.function";
import { splitSqlStatements } from "#core/functions/split-sql-statements.function";
import { sqlCodeOf } from "#core/functions/sql-code-of.function";
import type { ClassifiedStatement } from "#core/types/classified-statement.type";
import type { MigrationSafetyClass } from "#core/types/migration-safety-class.type";

/** An identifier, quoted or bare, as the folded text spells it. */
const IDENT = String.raw`(?:"[^"]+"|[a-z_][a-z0-9_$]*)`;

/** A name, schema-qualified or not. */
const QUALIFIED = String.raw`${IDENT}(?:\.${IDENT})?`;

/** A data write; `FOR UPDATE` and `FOR NO KEY UPDATE` lock the rows a read returns, they write nothing. */
const WRITE = /(?<!\bfor(?:\s+no\s+key)?\s+)\b(?:insert|update|delete|truncate|merge|copy)\b/;

/** The reason of a data write. */
const WRITES_DATA =
  "writes data; a migration changes the schema only and a backfill is a queue job (ADR 0159 decision 3, ADR 0334 rule 4)";

/** The reason of a statement gen does not read. */
const UNREAD = "gen cannot classify this statement, so it counts as destructive";

/** The reason of a string that holds several statements. */
const SEVERAL =
  "holds more than one statement, which gen classifies one at a time, so it counts as destructive";

/** The reason of a read or a `DO` block that calls a function gen does not know to be read-only. */
const CALLS =
  "calls a function that may write or drop data, which gen cannot read, so it counts as destructive";

/**
 * The functions a read or a `DO` block may call and stay `additive`: aggregates and scalar, array and `ltree` helpers
 * that write nothing (the ones `schema.refuseNulls` and the released pre-flights call), GUC reads and writes, and
 * advisory locks. Any other call may delete or backfill rows, so it counts as `contract`.
 */
const READ_ONLY_CALLS: ReadonlySet<string> = new Set([
  "array_agg",
  "array_length",
  "array_to_string",
  "avg",
  "bool_and",
  "bool_or",
  "cardinality",
  "char_length",
  "coalesce",
  "count",
  "current_setting",
  "every",
  "format",
  "greatest",
  "least",
  "length",
  "lower",
  "max",
  "min",
  "nlevel",
  "now",
  "nullif",
  "set_config",
  "string_agg",
  "string_to_array",
  "sum",
  "to_regclass",
  "upper",
]);

/** The advisory lock functions, `pg_advisory_*` and `pg_try_advisory_*`, which are read-only too. */
const ADVISORY = /^pg_(?:try_)?advisory_[a-z_]+$/;

/** The keywords and type names a `(` may follow without being a call. */
const NOT_CALLS: ReadonlySet<string> = new Set(
  (
    "all and any array as begin between bit by case cast char character check decimal declare distinct else elsif " +
    "end except exception exists filter float from group having if ilike in intersect interval into is join " +
    "lateral like limit loop not numeric offset on or order over partition raise recursive return returning row " +
    "select similar some then time timestamp union using values varchar varying when where while with within"
  ).split(" "),
);

/** A call: a name, schema-qualified or not, then `(`; a `::` before it makes it a type modifier. */
const CALL = new RegExp(String.raw`(::\s*)?(?:(${IDENT})\s*\.\s*)?(${IDENT})\s*\(`, "g");

/** The reason of a type change. */
const TYPE_CHANGE =
  "changes a column type, which rewrites the table and breaks the running release's values";

/** A class with its reason. */
const of = (safety: MigrationSafetyClass, reason: string): ClassifiedStatement => ({
  class: safety,
  reason,
});

/** The higher of two classified statements; the first on a tie. */
const higher = (a: ClassifiedStatement, b: ClassifiedStatement): ClassifiedStatement =>
  migrationSafetyRank(b.class) > migrationSafetyRank(a.class) ? b : a;

/** One part of a name as the folded code spells it, unquoted: a masked identifier (`sqlCodeOf`) is read back. */
const partOf = (part: string): string =>
  /^"0(?:[0-9a-f]{6})*"$/.test(part)
    ? String.fromCodePoint(
        ...(part.slice(2, -1).match(/.{6}/g) ?? []).map((unit) => Number.parseInt(unit, 16)),
      )
    : part.replaceAll('"', "");

/** A name as the created-table set holds it: unquoted and lowercased. */
const nameOf = (name: string | undefined): string =>
  (name ?? "")
    .split(".")
    .map((part) => partOf(part))
    .join(".")
    .toLowerCase();

/** The statement's code (`sqlCodeOf`) lowercased, whitespace folded, without its closing semicolon. */
const fold = (sql: string): string =>
  sqlCodeOf(sql).toLowerCase().replaceAll(/\s+/g, " ").trim().replace(/;$/, "").trim();

/** Whether folded `code` calls a function outside `READ_ONLY_CALLS`, schema-qualified by anything but `pg_catalog`. */
function callsUnknownFunction(code: string): boolean {
  for (const [, cast, schema, name] of code.matchAll(CALL)) {
    if (cast !== undefined || name === undefined) continue;
    if (schema === undefined && NOT_CALLS.has(name)) continue;
    const builtin = schema === undefined || schema === "pg_catalog";
    if (!builtin || !(READ_ONLY_CALLS.has(name) || ADVISORY.test(name))) return true;
  }
  return false;
}

/** The class of a `SELECT` or `WITH` statement: a read, unless it writes, creates a table or calls an unknown function. */
function read(s: string): ClassifiedStatement {
  if (WRITE.test(s) || /\binto\b/.test(s)) return of("banned", WRITES_DATA);
  if (callsUnknownFunction(s)) return of("contract", CALLS);
  return of("additive", "reads only");
}

/** Splits an `ALTER TABLE` action list on its top-level commas. */
function clausesOf(actions: string): string[] {
  const clauses: string[] = [];
  let depth = 0;
  let start = 0;
  for (const [index, char] of [...actions].entries()) {
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "," && depth === 0) {
      clauses.push(actions.slice(start, index).trim());
      start = index + 1;
    }
  }
  clauses.push(actions.slice(start).trim());
  return clauses.filter((clause) => clause !== "");
}

/** The class of one `ALTER TABLE` action on a table the running release already uses. */
function alterTableClause(clause: string): ClassifiedStatement {
  if (/^add (?:constraint |primary key|unique|foreign key|check|exclude)/.test(clause))
    return /\bnot valid\b|\busing index\b/.test(clause)
      ? of("additive", "adds a constraint NOT VALID, which checks new rows only")
      : of(
          "contract",
          "adds a constraint that checks every existing row under a lock; add it NOT VALID and validate it in a later step",
        );
  if (/^add\b/.test(clause))
    return /\bnot null\b/.test(clause) && !/\bdefault\b|\bgenerated\b/.test(clause)
      ? of(
          "contract",
          "adds a NOT NULL column without a default, which refuses the running release's writes",
        )
      : of("additive", "adds a nullable or defaulted column");
  if (/^drop constraint\b/.test(clause))
    return of("additive", "drops a constraint, which relaxes what the table accepts");
  if (/^drop\b/.test(clause))
    return of("contract", "drops a column the running release may still read or write");
  if (/^validate constraint\b/.test(clause))
    return of("online", "validates a constraint, which scans without blocking writes");
  if (/^rename\b/.test(clause))
    return of("contract", "renames a table, column or constraint the running release names");
  if (/^set schema\b/.test(clause))
    return of("contract", "moves the table to a schema the running release does not read");
  if (/^set (?:tablespace|logged|unlogged|access method)\b/.test(clause))
    return of("banned", "rewrites the table under an exclusive lock");
  if (/^alter (?:column )?\S+ (?:set data )?type\b/.test(clause))
    return of("contract", TYPE_CHANGE);
  if (/^alter (?:column )?\S+ set not null\b/.test(clause))
    return of("contract", "sets NOT NULL, which refuses the running release's null writes");
  if (
    /^alter (?:column )?\S+ (?:drop not null|set default|drop default|set statistics|set storage|set compression|add generated|set generated|restart|drop identity|drop expression)\b/.test(
      clause,
    )
  )
    return of("additive", "relaxes or annotates a column");
  if (/^detach partition\b/.test(clause))
    return of("contract", "detaches a partition, whose rows the running release stops seeing");
  if (
    /^(?:enable|disable|force|no force|owner to|set \(|reset \(|attach partition|replica identity|cluster on|set without cluster|inherit|no inherit|of |not of)/.test(
      clause,
    )
  )
    return of("additive", "changes the table's settings, not its data");
  return of("contract", UNREAD);
}

/** The class of a `DO` block, judged by its dollar-quoted body; a body gen cannot find counts as `contract`. */
function doBlock(sql: string): ClassifiedStatement {
  const code = sqlCodeOf(sql, true);
  const open = /(?<![\w$])\$(?:[A-Za-z_]\w*)?\$/.exec(code);
  const end = open === null ? -1 : code.indexOf(open[0], open.index + open[0].length);
  if (open === null || end === -1)
    return of("contract", "a DO block whose body gen cannot read, so it counts as destructive");
  const body = fold(code.slice(open.index + open[0].length, end));
  if (WRITE.test(body)) return of("banned", WRITES_DATA);
  if (
    /\b(?:perform|execute|call|create|alter|drop|grant|revoke|lock|notify|commit|rollback|refresh|reindex)\b/.test(
      body,
    )
  )
    return of(
      "contract",
      "a DO block that runs statements gen cannot read, so it counts as destructive",
    );
  if (callsUnknownFunction(body)) return of("contract", CALLS);
  return of("additive", "a DO block that only reads and raises, a pre-flight");
}

/** The class of an `ALTER` that is not `ALTER TABLE`. */
function alterOther(s: string): ClassifiedStatement {
  if (/^alter type\b/.test(s))
    return /\b(?:rename|drop attribute|alter attribute)\b/.test(s)
      ? of("contract", "renames or removes part of a type the running release uses")
      : of("additive", "extends a type");
  if (/\brename\b|\bset schema\b/.test(s))
    return of("contract", "renames or moves an object the running release names");
  return /^alter (?:index|sequence|view|materialized view|function|procedure|schema|collation|extension|domain|policy|trigger|default privileges|role|aggregate|operator|publication|subscription|statistics|text search)\b/.test(
    s,
  )
    ? of("additive", "changes an object's settings, not its data")
    : of("contract", UNREAD);
}

/** A `CREATE TABLE … AS` or `CREATE MATERIALIZED VIEW … AS`: its persistence, the object and the query that fills it. */
const FILLED = new RegExp(
  String.raw`^create (?:(?:global |local )?(temp|temporary|unlogged) )?(table|materialized view) (?:if not exists )?${QUALIFIED}(?: .*?)? as ((?:select|with|values|table|execute)\b.*)$`,
);

/**
 * The class of a table or materialized view a query fills, or `undefined` for any other statement: an empty one
 * (`WITH NO DATA`) is `additive`; a table that outlives the migration copies rows, a data write (`banned`, like
 * `SELECT … INTO`); a temporary table or a materialized view is judged by its query like a read, so a call gen cannot
 * vouch for is `contract`.
 */
function filledBy(s: string): ClassifiedStatement | undefined {
  const filled = FILLED.exec(s);
  if (filled === null) return undefined;
  const [, persistence, object = "table", query = ""] = filled;
  if (s.endsWith(" with no data")) return of("additive", `creates an empty ${object}`);
  if (object === "table" && persistence !== "temp" && persistence !== "temporary")
    return of("banned", WRITES_DATA);
  if (/^execute\b/.test(query)) return of("contract", UNREAD);
  const judged = read(query);
  return judged.class === "additive"
    ? of("additive", `creates a ${object} filled by a read`)
    : judged;
}

/** The class of a `CREATE` or `DROP`, or `undefined` for any other statement. */
function createOrDrop(s: string, created: ReadonlySet<string>): ClassifiedStatement | undefined {
  const filled = filledBy(s);
  if (filled !== undefined) return filled;
  if (/^create (?:unique )?index\b/.test(s)) {
    if (/^create (?:unique )?index concurrently\b/.test(s))
      return of("online", "builds an index concurrently in its own step");
    const on = new RegExp(String.raw` on (?:only )?(${QUALIFIED})`).exec(s);
    return on !== null && created.has(nameOf(on[1]))
      ? of("additive", "indexes a table this migration creates")
      : of(
          "banned",
          "builds an index on an existing table without CONCURRENTLY, which blocks its writes (ADR 0159 decision 3)",
        );
  }
  const table = new RegExp(
    String.raw`^create (?:(?:global |local )?(?:temp|temporary|unlogged) )?table (if not exists )?(${QUALIFIED})`,
  ).exec(s);
  // IF NOT EXISTS may adopt a table a release already uses, so what follows is judged against an existing table.
  if (table !== null)
    return table[1] === undefined
      ? { ...of("additive", "creates a table"), creates: nameOf(table[2]) }
      : of("additive", "creates a table unless it exists, so it may adopt one already in use");
  if (/^create\b/.test(s)) return of("additive", "creates a new object");
  if (/^drop index\b/.test(s)) return of("online", "drops an index, which loses no data");
  const dropped = new RegExp(
    String.raw`^drop table (?:if exists )?(${QUALIFIED})(?: cascade| restrict)?$`,
  ).exec(s);
  if (dropped !== null && created.has(nameOf(dropped[1])))
    return of("additive", "drops a table this migration creates");
  if (/^drop\b/.test(s)) {
    const kind = /^drop ((?:materialized )?[a-z]+)/.exec(s)?.[1] ?? "object";
    return of(
      "contract",
      `drops ${/^[aeiou]/.test(kind) ? "an" : "a"} ${kind} the running release may still use`,
    );
  }
  return undefined;
}

/**
 * The class of `sql`, one statement of a compiled step.
 *
 * @param sql - one statement as the compiled step holds it, comments included; several count as `contract`.
 * @param created - the tables an earlier statement of the same migration created (unquoted, lowercased).
 * @example
 * classifyMigrationStatement('alter table "orders"."orders" drop column "note"', new Set()).class; // "contract"
 */
export function classifyMigrationStatement(
  sql: string,
  created: ReadonlySet<string>,
): ClassifiedStatement {
  if (splitSqlStatements(sql).length > 1) return of("contract", SEVERAL);
  const s = fold(sql);
  if (s === "") return of("additive", "a comment or marker line");
  if (/^(?:with|select)\b/.test(s)) return read(s);
  if (/^(?:insert|update|delete|merge|truncate|copy)\b/.test(s)) return of("banned", WRITES_DATA);
  if (
    /^(?:vacuum|cluster|lock|load|checkpoint|alter system|create database|alter database|drop database|drop owned|reassign owned)\b/.test(
      s,
    )
  )
    return of("banned", "takes a table or the database out of service, which no migration does");
  if (/^reindex\b/.test(s))
    return /\bconcurrently\b/.test(s)
      ? of("online", "reindexes concurrently in its own step")
      : of("banned", "reindexes without CONCURRENTLY, which blocks writes");
  if (/^refresh materialized view\b/.test(s))
    return /\bconcurrently\b/.test(s)
      ? of("online", "refreshes a materialized view concurrently in its own step")
      : of("banned", "refreshes a materialized view without CONCURRENTLY, which blocks its reads");
  const object = createOrDrop(s, created);
  if (object !== undefined) return object;
  const alter = new RegExp(
    String.raw`^alter table (?:if exists )?(?:only )?(${QUALIFIED}) (.*)$`,
  ).exec(s);
  if (alter !== null)
    return created.has(nameOf(alter[1]))
      ? of("additive", "changes a table this migration creates")
      : clausesOf(alter[2] ?? "")
          .map((clause) => alterTableClause(clause))
          .reduce(higher, of("additive", "changes the table's settings, not its data"));
  if (/^alter\b/.test(s)) return alterOther(s);
  if (/^(?:comment on|grant|revoke|set|reset|security label|analyze)\b/.test(s))
    return of("additive", "annotates, grants or sets a setting; changes no data");
  if (/^do\b/.test(s)) return doBlock(sql);
  return of("contract", UNREAD);
}
