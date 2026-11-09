/**
 * Stackra file contract:
 * Purpose: `ColumnChangeRecord`, the runtime side of `ColumnChange`: records a nullability or type change of one
 *          existing column and compiles it to `ALTER COLUMN` statements, each with its inverse. `notNull({ safe: true })`
 *          compiles to ADR 0159's sequence instead: a `NOT VALID` check in the transactional step, then a later step
 *          that validates it, sets NOT NULL (which Postgres proves from the check, without a scan) and drops it.
 * Boundary: internal. It checks each value as it comes (a known SQL type, no second change of the same kind); the
 *           blueprint decides that a change is only made on an existing table.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (decision 3; the 2026-10-23 note: gen derives every inverse).
 */
import { constraintName } from "#core/functions/constraint-name.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { ColumnChange } from "#core/types/column-change.type";
import type { CompiledStatement } from "#core/types/compiled-statement.type";
import type { CompiledStep } from "#core/types/compiled-step.type";

/** The SQL types a blueprint writes, and so the ones a change converts between. */
const SQL_TYPE =
  /^(text|integer|bigint|boolean|timestamptz|uuid|jsonb|tsvector|ltree|geography\((Point|Polygon|LineString),4326\)|varchar\([1-9]\d{0,7}\)|char\([1-9]\d{0,7}\)|numeric\([1-9]\d{0,3}, \d{1,4}\))$/;

/** Refuses a type the blueprint does not write. */
function assertType(column: string, type: string): void {
  if (!SQL_TYPE.test(type))
    throw new TypeError(`${column}: "${type}" is not a column type a blueprint writes`);
}

/** The reason and the squawk ignore written above a type change Postgres makes without rewriting the table. */
const WIDEN_SQUAWK_IGNORE =
  "-- lint: widening a varchar, or varchar to text, changes only the catalog; Postgres does not rewrite the table.\n" +
  "-- squawk-ignore changing-column-type\n";

/** The length of a `varchar(n)` type, or undefined for any other type. */
const varcharLength = (type: string): number | undefined => {
  const match = /^varchar\((\d+)\)$/.exec(type);
  return match?.[1] === undefined ? undefined : Number(match[1]);
};

/**
 * Whether `from` to `to` only widens a varchar (`varchar(n)` to a longer `varchar(m)`) or turns it into `text`, with no
 * custom conversion: Postgres changes the catalog and rewrites nothing. Every other change, narrowing included, stays
 * flagged.
 */
function widens(from: string, to: string, using: string | undefined): boolean {
  const before = varcharLength(from);
  if (using !== undefined || before === undefined) return false;
  const after = varcharLength(to);
  return to === "text" || (after !== undefined && after > before);
}

/** One recorded column change. */
export class ColumnChangeRecord implements ColumnChange {
  /** The column name. */
  readonly name: string;

  /** The new nullability, when it changes. */
  private nullability: "null" | "not null" | undefined = undefined;

  /** Whether NOT NULL is set through a validated check, `notNull({ safe: true })`. */
  private safe = false;

  /** The type change, when there is one. */
  private conversion:
    | { readonly to: string; readonly from: string; readonly using: string | undefined }
    | undefined = undefined;

  /**
   * @param name - the column name, snake_case.
   * @throws TypeError for a name that is not snake_case.
   */
  constructor(name: string) {
    quoteIdentifier(name);
    this.name = name;
  }

  /** Records `DROP NOT NULL` on the column, as `ColumnChange.nullable` describes. */
  nullable(): this {
    return this.setNullability("null");
  }

  /** Records `SET NOT NULL` on the column, as `ColumnChange.notNull` describes. */
  notNull(options: { readonly safe?: boolean } = {}): this {
    this.setNullability("not null");
    this.safe = options.safe === true;
    return this;
  }

  /**
   * Records a type conversion of the column, as `ColumnChange.type` describes.
   *
   * @throws TypeError for a type the blueprint does not write, the same type on both sides, a blank `using`, or a
   *         second type change of the column.
   */
  type(to: string, options: { readonly from: string; readonly using?: string }): this {
    if (this.conversion !== undefined)
      throw new TypeError(`${this.name} already changes its type in this blueprint`);
    assertType(this.name, to);
    assertType(this.name, options.from);
    if (to === options.from) throw new TypeError(`${this.name} is already ${to}`);
    if (options.using?.trim() === "")
      throw new TypeError(`The conversion expression of ${this.name} is blank`);
    this.conversion = { to, from: options.from, using: options.using };
    return this;
  }

  /**
   * The `ALTER COLUMN` statements, type first, each with its inverse; a safe NOT NULL adds its `NOT VALID` check here.
   *
   * @param table - the table name, without its schema, which names the check.
   * @param qualified - the quoted, schema-qualified table.
   * @throws TypeError when the change changes nothing.
   */
  statements(table: string, qualified: string): readonly CompiledStatement[] {
    const column = quoteIdentifier(this.name);
    const alter = `alter table ${qualified} alter column ${column}`;
    const statements: CompiledStatement[] = [];
    if (this.conversion !== undefined) {
      const { to, from, using } = this.conversion;
      statements.push({
        sql: `${widens(from, to, using) ? WIDEN_SQUAWK_IGNORE : ""}${alter} type ${to} using ${using ?? `${column}::${to}`}`,
        inverse: [`${alter} type ${from} using ${column}::${from}`],
      });
    }
    if (this.safe) {
      const check = this.checkName(table);
      statements.push({
        sql: `alter table ${qualified} add constraint ${check} check (${column} is not null) not valid`,
        inverse: [`alter table ${qualified} drop constraint if exists ${check}`],
      });
    } else if (this.nullability !== undefined)
      statements.push(
        this.nullability === "null"
          ? { sql: `${alter} drop not null`, inverse: [`${alter} set not null`] }
          : { sql: `${alter} set not null`, inverse: [`${alter} drop not null`] },
      );
    if (statements.length === 0)
      throw new TypeError(
        `t.change("${this.name}") changes nothing: call nullable(), notNull() or type()`,
      );
    return statements;
  }

  /**
   * The later step of a safe NOT NULL: validate the check (SHARE UPDATE EXCLUSIVE, so writes go on while it scans),
   * set NOT NULL (proven by the valid check, so no second scan) and drop the check. None for any other change.
   *
   * @param table - the table name, without its schema, which names the check.
   * @param qualified - the quoted, schema-qualified table.
   */
  laterSteps(table: string, qualified: string): readonly CompiledStep[] {
    if (!this.safe) return [];
    const check = this.checkName(table);
    const alter = `alter table ${qualified} alter column ${quoteIdentifier(this.name)}`;
    return [
      {
        sql: [
          `alter table ${qualified} validate constraint ${check}`,
          `${alter} set not null`,
          `alter table ${qualified} drop constraint ${check}`,
        ],
        transactional: true,
        inverse: [
          `${alter} drop not null`,
          `alter table ${qualified} add constraint ${check} check (${quoteIdentifier(this.name)} is not null) not valid`,
        ],
      },
    ];
  }

  /** The quoted name of a safe NOT NULL's check, `ck_<table>_<column>_not_null`. */
  private checkName(table: string): string {
    return quoteIdentifier(constraintName("ck", table, [this.name, "not_null"]));
  }

  /** Records the new nullability, refusing a second one. */
  private setNullability(nullability: "null" | "not null"): this {
    if (this.nullability !== undefined)
      throw new TypeError(`${this.name} already changes its nullability in this blueprint`);
    this.nullability = nullability;
    return this;
  }
}
