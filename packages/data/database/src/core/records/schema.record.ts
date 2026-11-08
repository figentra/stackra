/**
 * Stackra file contract:
 * Purpose: `SchemaRecord`, the runtime side of `SchemaBuilder`: records a migration's operations in order and compiles
 *          them to steps, one transactional step first and then each online statement as its own step, each with
 *          its derived inverse. A `systemFunction` compiles to its marker line, the system-access role, the function
 *          and the grants that hand it to the role.
 * Boundary: internal. Raw statements keep the inverse the migration stated; a `CONCURRENTLY` statement becomes its
 *           own non-transactional step. Extensions are the ADR 0160 list and PostGIS (ADR 0314) only; an ICU
 *           collation is created in the module's schema. A raw `CREATE SEQUENCE` is refused: a document number is a
 *           `Sequence` (ADR 0342 d5), and an id is a public id, so no migration needs one.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3; 2026-10-23 and 2026-10-24 notes); ADR 0160 (approved extensions); ADR
 *                     0314 (PostGIS); ADR 0342 (decision 5) and ADR 0394 (decision 3: no Postgres sequence); ADR 0239
 *                     (2026-11-07 amendment, gap A: system functions).
 */
import { Enum } from "@stackra/contracts";

import { PUBLIC_ID_TEXT } from "#core/constants/public-id-text.constant";
import { SYSTEM_ACCESS_ROLE } from "#core/constants/system-access-role.constant";
import { TABLE_DECLARATION_MARKERS } from "#core/constants/table-declaration-markers.constant";
import { Extension } from "#core/enums/extension.enum";
import { declarationReason } from "#core/functions/declaration-reason.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";
import { systemAccessRoleSql } from "#core/functions/system-access-role-sql.function";
import { BlueprintRecord } from "#core/records/blueprint.record";
import type { Blueprint } from "#core/types/blueprint.type";
import type { CompiledStatement } from "#core/types/compiled-statement.type";
import type { CompiledStep } from "#core/types/compiled-step.type";
import type { MacroClass } from "#core/types/macro-class.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import type { SystemFunctionOptions } from "#core/types/system-function-options.type";

/** One recorded operation: a table blueprint, or a statement with its inverse. */
type Operation =
  | { readonly blueprint: BlueprintRecord }
  | { readonly collation: string; readonly locale: string }
  | { readonly extension: Extension }
  | {
      readonly column: string;
      readonly tables: readonly string[];
      readonly remedy: string;
      readonly where: string | undefined;
    }
  | { readonly statement: string; readonly inverse: string | false }
  | { readonly systemFunction: SystemFunction };

/** A checked `systemFunction`: its arguments and columns as name and type pairs. */
interface SystemFunction {
  readonly name: string;
  readonly args: readonly (readonly [string, string])[];
  readonly returns: readonly (readonly [string, string])[];
  readonly sql: string;
  readonly reason: string;
}

/** A SQL type name a system function's argument or column takes: `integer`, `varchar(33)`, `text[]`. */
const SQL_TYPE = /^[a-z][a-z0-9_]*(?: [a-z][a-z0-9_]*)*(?:\(\d+(?:, ?\d+)?\))?(?:\[\])?$/;

/** The dollar quote of a system function's body. */
const BODY_QUOTE = "$stackra$";

/** A statement that cannot run inside a transaction. */
const CONCURRENTLY = /\bconcurrently\b/i;

/** A Postgres sequence, which a rolled-back transaction burns a value of. */
const CREATE_SEQUENCE = /\bcreate\s+(?:(?:temp|temporary|unlogged)\s+)?sequence\b/i;

/** The inverse of a run of statements: theirs, last first, or `false` when one has none. */
function inverseOf(statements: readonly CompiledStatement[]): readonly string[] | false {
  const inverses: string[] = [];
  for (let index = statements.length - 1; index >= 0; index--) {
    const inverse = statements[index]?.inverse ?? [];
    if (inverse === false) return false;
    inverses.push(...inverse);
  }
  return inverses;
}

/**
 * A `DO` block that counts the rows of each table whose `column` is null and raises one error naming every non-zero
 * count and the remedy. It has no blank line, so a runner that splits a step on blank lines keeps it whole.
 */
function refuseNullsSql(
  schema: string,
  {
    column,
    tables,
    remedy,
    where,
  }: { column: string; tables: readonly string[]; remedy: string; where: string | undefined },
): string {
  const also = where === undefined ? "" : ` and (${where})`;
  const counts = tables.map((table) => {
    const qualified = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
    return [
      `  select count(*) into n from ${qualified} where ${quoteIdentifier(column)} is null${also};`,
      `  if n > 0 then found := found || format('%s %s', ${sqlLiteral(`${schema}.${table}`)}, n); end if;`,
    ].join("\n");
  });
  return [
    "do $$",
    "declare",
    "  found text[] := '{}';",
    "  n bigint;",
    "begin",
    ...counts,
    "  if cardinality(found) > 0 then",
    `    raise exception 'refused before any change: rows with a null %: %. %', ${sqlLiteral(column)}, array_to_string(found, ', '), ${sqlLiteral(remedy)};`,
    "  end if;",
    "end",
    "$$",
  ].join("\n");
}

/** A statement whose undoing is the function's drop. */
const step = (sql: string): CompiledStatement => ({ sql, inverse: [] });

/**
 * A system function's marker line, the role, the function, then its hand-over to the role. `EXECUTE` is revoked from
 * `PUBLIC` while the migrator owns it; the owner change moves the owner's own grant to the role, so the migrator's
 * `EXECUTE` is granted after it, by the migrator as a member of the new owner. A non-superuser can give a function
 * only to a role it can `SET ROLE` to and that may create in the schema, so the migrator holds both for the hand-over
 * alone, inside the migration's transaction.
 */
function systemFunctionSql(schema: string, fn: SystemFunction): CompiledStatement[] {
  const role = quoteIdentifier(SYSTEM_ACCESS_ROLE);
  const namespace = quoteIdentifier(schema);
  const name = `${namespace}.${quoteIdentifier(fn.name)}`;
  const signature = `${name}(${fn.args.map(([, type]) => type).join(", ")})`;
  const typed = (pairs: SystemFunction["args"]) =>
    pairs.map(([column, type]) => `${quoteIdentifier(column)} ${type}`).join(", ");
  return [
    step(`${TABLE_DECLARATION_MARKERS.systemFunction} ${schema}.${fn.name} ${fn.reason}`),
    systemAccessRoleSql(),
    {
      sql: [
        `create function ${name}(${typed(fn.args)}) returns table (${typed(fn.returns)})`,
        "language sql security definer set search_path = pg_catalog, pg_temp",
        `as ${BODY_QUOTE}`,
        fn.sql,
        BODY_QUOTE,
      ].join("\n"),
      inverse: [`drop function if exists ${signature}`],
    },
    step(`revoke all on function ${signature} from public`),
    step(`grant ${role} to current_user`),
    step(`grant create on schema ${namespace} to ${role}`),
    step(`alter function ${signature} owner to ${role}`),
    step(`revoke create on schema ${namespace} from ${role}`),
    step(`grant execute on function ${signature} to current_user`),
    step(`revoke ${role} from current_user`),
  ];
}

/** The recorded schema changes of one migration. */
export class SchemaRecord implements SchemaBuilder {
  /** The macros every blueprint installs. */
  private readonly macros: readonly MacroClass[];

  /** The SQL type of a public-id key column: `uuid` or `varchar(33)`. */
  private readonly publicIdColumn: string;

  /** The operations, in the order `up` recorded them. */
  private readonly operations: Operation[] = [];

  /**
   * @param macros - the macros every blueprint installs.
   * @param publicIdColumn - the SQL type of a public-id key column (`CompileOptions.publicIds`).
   */
  constructor(macros: readonly MacroClass[], publicIdColumn: string = PUBLIC_ID_TEXT) {
    this.macros = macros;
    this.publicIdColumn = publicIdColumn;
  }

  /** Implements `SchemaBuilder.create`, documented there. */
  create(table: string, define: (t: Blueprint) => void): void {
    this.record(new BlueprintRecord(table, true, this.macros, this.publicIdColumn), define);
  }

  /** Implements `SchemaBuilder.table`, documented there. */
  table(table: string, define: (t: Blueprint) => void): void {
    this.record(new BlueprintRecord(table, false, this.macros, this.publicIdColumn), define);
  }

  /**
   * Implements `SchemaBuilder.sql`, documented there.
   *
   * @throws TypeError for a blank statement, a `CREATE SEQUENCE`, or an inverse that is neither a statement nor `false`.
   */
  sql(statement: string, options: { readonly inverse: string | false }): void {
    if (statement.trim() === "") throw new TypeError("schema.sql needs a statement");
    if (CREATE_SEQUENCE.test(statement))
      throw new TypeError(
        "schema.sql creates a Postgres sequence: a document number is a Sequence({ key }) in database/sequences/ (ADR 0342), an id is a public id",
      );
    const inverse = options?.inverse;
    if (inverse !== false && (typeof inverse !== "string" || inverse.trim() === ""))
      throw new TypeError(
        "schema.sql needs { inverse }: the statement that undoes it, or false when nothing can",
      );
    this.operations.push({ statement, inverse });
  }

  /**
   * Implements `SchemaBuilder.refuseNulls`, documented there.
   *
   * @throws TypeError for a column or table that is not snake_case, no table, or a blank remedy.
   */
  refuseNulls(
    column: string,
    tables: readonly string[],
    remedy: string,
    options: { readonly where?: string } = {},
  ): void {
    quoteIdentifier(column);
    for (const table of tables) quoteIdentifier(table);
    if (tables.length === 0) throw new TypeError("schema.refuseNulls needs at least one table");
    if (remedy.trim() === "") throw new TypeError("schema.refuseNulls needs the remedy to name");
    if (options.where?.includes("$$") === true || options.where?.includes("\n") === true)
      throw new TypeError("schema.refuseNulls takes a one-line where without $$");
    this.operations.push({ column, tables: [...tables], remedy, where: options.where });
  }

  /**
   * Implements `SchemaBuilder.createExtension`, documented there.
   *
   * @throws TypeError for an extension ADR 0160 does not approve.
   */
  createExtension(extension: Extension): void {
    if (!Enum.values(Extension).includes(extension))
      throw new TypeError(
        `"${extension}" is not an approved extension (${Enum.values(Extension).join(", ")}); a new one needs an ADR`,
      );
    this.operations.push({ extension });
  }

  /**
   * Implements `SchemaBuilder.createCollation`, documented there.
   *
   * @throws TypeError for a name that is not snake_case, or a locale that is not a BCP 47 tag.
   */
  createCollation(name: string, locale: string): void {
    quoteIdentifier(name);
    if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{1,8})*$/.test(locale))
      throw new TypeError(`"${locale}" is not a BCP 47 locale for an ICU collation`);
    this.operations.push({ collation: name, locale });
  }

  /**
   * Implements `SchemaBuilder.systemFunction`, documented there.
   *
   * @throws TypeError for an empty reason, a name that is not snake_case, no returned column, a type that is not a SQL
   *         type name, or a body that is blank, holds a blank line or the body's dollar quote.
   */
  systemFunction(options: SystemFunctionOptions): void {
    const reason = declarationReason("schema.systemFunction", options?.reason);
    quoteIdentifier(options.name);
    const args = Object.entries(options.args ?? {});
    const returns = Object.entries(options.returns ?? {});
    if (returns.length === 0)
      throw new TypeError(`schema.systemFunction ${options.name} declares the columns it returns`);
    for (const [name, type] of [...args, ...returns]) {
      quoteIdentifier(name);
      if (typeof type !== "string" || !SQL_TYPE.test(type))
        throw new TypeError(
          `schema.systemFunction ${options.name}: "${type}" is not a SQL type name`,
        );
    }
    const sql = typeof options.sql === "string" ? options.sql.trim() : "";
    if (sql === "" || sql.includes(BODY_QUOTE) || /\n\s*\n/.test(sql))
      throw new TypeError(
        `schema.systemFunction ${options.name} needs a body with no blank line and no ${BODY_QUOTE}`,
      );
    this.operations.push({ systemFunction: { name: options.name, args, returns, sql, reason } });
  }

  /**
   * The steps of the migration in apply order.
   *
   * @param schema - the module's Postgres schema.
   * @param createsSchema - whether the transactional step creates the schema first.
   */
  compile(schema: string, createsSchema: boolean): readonly CompiledStep[] {
    const transactional: CompiledStatement[] = [];
    const online: CompiledStep[] = [];
    if (createsSchema)
      transactional.push({
        sql: `create schema if not exists ${quoteIdentifier(schema)}`,
        inverse: [`drop schema if exists ${quoteIdentifier(schema)}`],
      });
    for (const operation of this.operations) {
      if ("collation" in operation) {
        const collation = `${quoteIdentifier(schema)}.${quoteIdentifier(operation.collation)}`;
        transactional.push({
          sql: `create collation if not exists ${collation} (provider = icu, locale = ${sqlLiteral(operation.locale)})`,
          inverse: [`drop collation if exists ${collation}`],
        });
        continue;
      }
      // An extension is the database's, shared by every module that needs it: a down never drops it (STA-1689).
      if ("extension" in operation) {
        transactional.push({
          sql: `create extension if not exists ${quoteIdentifier(operation.extension)}`,
          inverse: [],
        });
        continue;
      }
      if ("remedy" in operation) {
        transactional.push({ sql: refuseNullsSql(schema, operation), inverse: [] });
        continue;
      }
      if ("systemFunction" in operation) {
        transactional.push(...systemFunctionSql(schema, operation.systemFunction));
        continue;
      }
      if ("blueprint" in operation) {
        const compiled = operation.blueprint.compile(schema);
        transactional.push(...compiled.statements);
        online.push(...compiled.online);
        continue;
      }
      const inverse = operation.inverse === false ? false : [operation.inverse];
      if (CONCURRENTLY.test(operation.statement))
        online.push({ sql: [operation.statement], transactional: false, inverse });
      else transactional.push({ sql: operation.statement, inverse });
    }
    const first: CompiledStep[] =
      transactional.length === 0
        ? []
        : [
            {
              sql: transactional.map((statement) => statement.sql),
              transactional: true,
              inverse: inverseOf(transactional),
            },
          ];
    return [...first, ...online];
  }

  /** Runs `define` on `blueprint` and records it. */
  private record(blueprint: BlueprintRecord, define: (t: Blueprint) => void): void {
    define(blueprint.asBlueprint());
    this.operations.push({ blueprint });
  }
}
