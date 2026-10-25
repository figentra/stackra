/**
 * Stackra file contract:
 * Purpose: `SchemaRecord`, the runtime side of `SchemaBuilder`: records a migration's operations in order and compiles
 *          them to steps, one transactional step first and then each online statement as its own step, each with
 *          its derived inverse.
 * Boundary: internal. Raw statements keep the inverse the migration stated; a `CONCURRENTLY` statement becomes its
 *           own non-transactional step. Extensions are the ADR 0160 list only.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3; 2026-10-23 and 2026-10-24 notes); ADR 0160 (approved extensions).
 */
import { Enum } from "@stackra/contracts";

import { Extension } from "#core/enums/extension.enum";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { BlueprintRecord } from "#core/records/blueprint.record";
import type { Blueprint } from "#core/types/blueprint.type";
import type { CompiledStatement } from "#core/types/compiled-statement.type";
import type { CompiledStep } from "#core/types/compiled-step.type";
import type { MacroClass } from "#core/types/macro-class.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";

/** One recorded operation: a table blueprint, or a statement with its inverse. */
type Operation =
  | { readonly blueprint: BlueprintRecord }
  | { readonly statement: string; readonly inverse: string | false };

/** A statement that cannot run inside a transaction. */
const CONCURRENTLY = /\bconcurrently\b/i;

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

/** The recorded schema changes of one migration. */
export class SchemaRecord implements SchemaBuilder {
  /** The macros every blueprint installs. */
  private readonly macros: readonly MacroClass[];

  /** The operations, in the order `up` recorded them. */
  private readonly operations: Operation[] = [];

  /** @param macros - the macros every blueprint installs. */
  constructor(macros: readonly MacroClass[]) {
    this.macros = macros;
  }

  /** See `SchemaBuilder.create`. */
  create(table: string, define: (t: Blueprint) => void): void {
    this.record(new BlueprintRecord(table, true, this.macros), define);
  }

  /** See `SchemaBuilder.table`. */
  table(table: string, define: (t: Blueprint) => void): void {
    this.record(new BlueprintRecord(table, false, this.macros), define);
  }

  /**
   * See `SchemaBuilder.sql`.
   *
   * @throws TypeError for a blank statement, or an inverse that is neither a statement nor `false`.
   */
  sql(statement: string, options: { readonly inverse: string | false }): void {
    if (statement.trim() === "") throw new TypeError("schema.sql needs a statement");
    const inverse = options?.inverse;
    if (inverse !== false && (typeof inverse !== "string" || inverse.trim() === ""))
      throw new TypeError(
        "schema.sql needs { inverse }: the statement that undoes it, or false when nothing can",
      );
    this.operations.push({ statement, inverse });
  }

  /**
   * See `SchemaBuilder.createExtension`.
   *
   * @throws TypeError for an extension ADR 0160 does not approve.
   */
  createExtension(extension: Extension): void {
    if (!Enum.values(Extension).includes(extension))
      throw new TypeError(
        `"${extension}" is not an approved extension (${Enum.values(Extension).join(", ")}); a new one needs an ADR`,
      );
    this.operations.push({
      statement: `create extension if not exists ${quoteIdentifier(extension)}`,
      inverse: `drop extension if exists ${quoteIdentifier(extension)}`,
    });
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
