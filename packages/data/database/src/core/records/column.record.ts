/**
 * Stackra file contract:
 * Purpose: `ColumnRecord`, the recorded state of one blueprint column, and its SQL: the column definition, its
 *          comment statement, its foreign key and its enum check, each of the last two inline or `NOT VALID` for an
 *          existing table (ADR 0159 d3, stackra-251).
 * Boundary: internal; the runtime side of `ColumnDefinition` and `ForeignKeyColumn`. It records calls and checks each
 *           value as it comes; the blueprint decides where each statement goes (create, alter, online step).
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305; ADR 0231 (`fk_`, `ck_`); ADR 0014 (decision 6);
 *                     the Arabic collation row (OS-391).
 */
import { constraintName } from "#core/functions/constraint-name.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";
import type { ForeignKeyColumn } from "#core/types/foreign-key-column.type";

/** What a column starts with besides its name and type. */
interface ColumnSeed {
  readonly nullability?: "null" | "not null";
  readonly comment?: string;
  readonly suffix?: string;
  readonly defaultSql?: string;
  readonly indexed?: boolean;
  readonly values?: readonly string[];
  readonly references?: string;
  readonly primary?: boolean;
}

/** One recorded column. */
export class ColumnRecord implements ForeignKeyColumn {
  /** The column name. */
  readonly name: string;

  /** The SQL type (`varchar(64)`, `timestamptz`). */
  readonly type: string;

  /** Text added to the comment of this column of a group (a money pair's unit). */
  readonly suffix: string;

  /** The enum items its check constraint allows, when it is an enum. */
  readonly values: readonly string[] | undefined;

  /** The same-module table its foreign key references, when it has one. */
  readonly references: string | undefined;

  /** Whether it is the primary key on its own. */
  readonly primary: boolean;

  /** The stated nullability; undefined until stated. */
  nullability: "null" | "not null" | undefined;

  /** The comment; undefined until stated. */
  commentText: string | undefined;

  /** The default as SQL, when it has one. */
  defaultSql: string | undefined;

  /** The generation expression of a stored generated column. */
  generated: string | undefined = undefined;

  /** Whether it gets an index of its own. */
  indexed: boolean;

  /** Whether deleting the referenced row deletes this one. */
  cascades = false;

  /** The module collation it compares and sorts by (`arabic`), when not the database default. */
  collation: string | undefined = undefined;

  /**
   * @param name - the column name, snake_case.
   * @param type - the SQL type.
   * @param seed - the state a built-in column starts with.
   */
  constructor(name: string, type: string, seed: ColumnSeed = {}) {
    quoteIdentifier(name);
    this.name = name;
    this.type = type;
    this.nullability = seed.nullability;
    this.commentText = seed.comment;
    this.suffix = seed.suffix ?? "";
    this.defaultSql = seed.defaultSql;
    this.indexed = seed.indexed ?? false;
    this.values = seed.values;
    this.references = seed.references;
    this.primary = seed.primary ?? false;
  }

  /** Implements `ColumnDefinition.notNull`, documented there. */
  notNull(): this {
    this.nullability = "not null";
    return this;
  }

  /** Implements `ColumnDefinition.nullable`, documented there. */
  nullable(): this {
    this.nullability = "null";
    return this;
  }

  /**
   * Implements `ColumnDefinition.comment`, documented there.
   *
   * @throws TypeError for a blank comment.
   */
  comment(text: string): this {
    if (text.trim() === "") throw new TypeError(`The comment of ${this.name} is blank`);
    this.commentText = text;
    return this;
  }

  /**
   * Implements `ColumnDefinition.default`, documented there.
   *
   * @throws TypeError on a generated column, or for a value with no SQL literal.
   */
  default(value: string | number | boolean | null | object): this {
    if (this.generated !== undefined)
      throw new TypeError(`${this.name} is generated, so it takes no default`);
    this.defaultSql = sqlLiteral(value);
    return this;
  }

  /** Implements `ColumnDefinition.index`, documented there. */
  index(): this {
    this.indexed = true;
    return this;
  }

  /**
   * Implements `ColumnDefinition.storedAs`, documented there.
   *
   * @throws TypeError for a blank expression or a column that has a default.
   */
  storedAs(expression: string): this {
    if (expression.trim() === "") throw new TypeError(`The expression of ${this.name} is blank`);
    if (this.defaultSql !== undefined)
      throw new TypeError(`${this.name} has a default, so it cannot be generated`);
    this.generated = expression;
    return this;
  }

  /**
   * Implements `ColumnDefinition.collate`, documented there.
   *
   * @throws TypeError for a name that is not snake_case, or a column that is not text.
   */
  collate(collation: string): this {
    quoteIdentifier(collation);
    if (!/^(varchar|text|citext)\b/.test(this.type))
      throw new TypeError(`${this.name} is ${this.type}, so it takes no collation`);
    this.collation = collation;
    return this;
  }

  /**
   * Implements `ForeignKeyColumn.cascadeOnDelete`, documented there.
   *
   * @throws TypeError on a column that is not a foreign key.
   */
  cascadeOnDelete(): this {
    if (this.references === undefined)
      throw new TypeError(`${this.name} is not a foreign key: use t.belongsTo(...)`);
    this.cascades = true;
    return this;
  }

  /**
   * Implements `ForeignKeyColumn.withoutIndex`, documented there.
   *
   * @throws TypeError on a column that is not a foreign key or a link.
   */
  withoutIndex(): this {
    if (!this.indexed) throw new TypeError(`${this.name} has no index to leave out`);
    this.indexed = false;
    return this;
  }

  /**
   * The column definition inside `CREATE TABLE` or `ADD COLUMN`; a collation is the module schema's.
   *
   * @param checked - false leaves the enum check out, for `checkSql` to add it `NOT VALID` on an existing table.
   */
  definition(table: string, schema: string, checked = true): string {
    const parts = [quoteIdentifier(this.name), this.type];
    if (this.collation !== undefined)
      parts.push(`collate ${quoteIdentifier(schema)}.${quoteIdentifier(this.collation)}`);
    if (this.generated !== undefined) parts.push(`generated always as (${this.generated}) stored`);
    if (this.defaultSql !== undefined) parts.push(`default ${this.defaultSql}`);
    if (this.nullability !== undefined) parts.push(this.nullability);
    const check = this.checkConstraint(table);
    if (checked && check !== undefined) parts.push(check);
    return parts.join(" ");
  }

  /**
   * The enum check added `NOT VALID` to an existing table, so adding it takes no scan; `validateSql` scans later.
   */
  checkSql(table: string, qualified: string): string | undefined {
    const check = this.checkConstraint(table);
    return check === undefined ? undefined : `alter table ${qualified} add ${check} not valid`;
  }

  /** The `VALIDATE CONSTRAINT` statements of this column's `NOT VALID` foreign key and check, in that order. */
  validateSql(table: string, qualified: string): string[] {
    return [
      ...(this.references === undefined ? [] : [constraintName("fk", table, [this.name])]),
      ...(this.values === undefined ? [] : [constraintName("ck", table, [this.name])]),
    ].map((name) => `alter table ${qualified} validate constraint ${quoteIdentifier(name)}`);
  }

  /** The `COMMENT ON COLUMN` statement. */
  commentSql(qualified: string): string {
    return `comment on column ${qualified}.${quoteIdentifier(this.name)} is ${sqlLiteral(`${this.commentText ?? ""}${this.suffix}`)}`;
  }

  /**
   * The foreign key statement, when it is a foreign key.
   *
   * @param notValid - true on an existing table: the key holds for new rows at once, and `validateSql` checks the rest.
   */
  foreignKeySql(
    schema: string,
    table: string,
    qualified: string,
    notValid = false,
  ): string | undefined {
    if (this.references === undefined) return undefined;
    const target = `${quoteIdentifier(schema)}.${quoteIdentifier(this.references)}`;
    const name = quoteIdentifier(constraintName("fk", table, [this.name]));
    const rule = this.cascades ? " on delete cascade" : "";
    return `alter table ${qualified} add constraint ${name} foreign key (${quoteIdentifier(this.name)}) references ${target} ("id")${rule}${notValid ? " not valid" : ""}`;
  }

  /** The named enum check constraint, when it is an enum. */
  private checkConstraint(table: string): string | undefined {
    if (this.values === undefined) return undefined;
    return `constraint ${quoteIdentifier(constraintName("ck", table, [this.name]))} check (${quoteIdentifier(this.name)} in (${this.values.map(sqlLiteral).join(", ")}))`;
  }
}
