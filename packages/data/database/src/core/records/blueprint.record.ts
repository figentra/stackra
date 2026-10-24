/**
 * Stackra file contract:
 * Purpose: `BlueprintRecord`, the runtime side of `Blueprint` for one table: records columns, indexes, the primary
 *          key and scope policies, installs the member's macros under their names, and compiles to SQL statements.
 * Boundary: internal. It enforces the migration safety rules it can see in one table: every column states its
 *           nullability and has a comment; a column added to an existing table is nullable, defaulted or generated;
 *           an index on an existing table is built concurrently in its own step, and one on a table being created
 *           builds in the transaction; no primary key is added to an existing table.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3; as amended by ADR 0305); ADR 0239 (equality policy); ADR 0231 (names);
 *                     ADR 0135 (public ids); ADR 0294 (decision 28: links).
 */
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { scopeSetting } from "#core/functions/scope-setting.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";
import { ColumnRecord } from "#core/records/column.record";
import { ColumnGroupRecord } from "#core/records/column-group.record";
import { TableIndexRecord } from "#core/records/table-index.record";
import type { Blueprint } from "#core/types/blueprint.type";
import type { ColumnDefinition } from "#core/types/column-definition.type";
import type { CompiledStatement } from "#core/types/compiled-statement.type";
import type { CompiledStep } from "#core/types/compiled-step.type";
import type { MacroClass } from "#core/types/macro-class.type";

/** A public id column: a 6-letter prefix, `_` and 26 characters fit. */
const PUBLIC_ID = "varchar(33)";

/** A public id prefix: 2 to 6 lowercase letters. */
const PREFIX = /^[a-z]{2,6}$/;

/** The longest `varchar` Postgres takes. */
const MAX_VARCHAR = 10_485_760;

/**
 * One recorded table. It does not `implements Blueprint`: a member's macros merge into that interface (gen's
 * `blueprint.d.ts`), and this class gets them as installed methods at run time, not as declared members.
 */
export class BlueprintRecord {
  /** The table name, relative to the module's schema. */
  readonly table: string;

  /** Whether the migration creates the table (else it changes an existing one). */
  readonly creating: boolean;

  /** The columns, in the order they were written. */
  private readonly columns: ColumnRecord[] = [];

  /** The indexes, in the order they were written. */
  private readonly indexes: TableIndexRecord[] = [];

  /** The scope levels with a row-level-security policy. */
  private readonly scopes: string[] = [];

  /** The composite primary key, when one was declared. */
  private primaryKey: readonly string[] | undefined = undefined;

  /**
   * @param table - the table name, snake_case.
   * @param creating - true for `schema.create`, false for `schema.table`.
   * @param macros - the macros to install as methods.
   * @throws TypeError for a table name that is not snake_case, a macro class not named `<Name>Macro`, or a macro whose
   *         name a built-in method already has.
   */
  constructor(table: string, creating: boolean, macros: readonly MacroClass[]) {
    quoteIdentifier(table);
    this.table = table;
    this.creating = creating;
    for (const MacroClass of macros) {
      if (!MacroClass.name.endsWith("Macro") || MacroClass.name === "Macro")
        throw new TypeError(`${MacroClass.name} is not named <Name>Macro`);
      const stem = MacroClass.name.slice(0, -"Macro".length);
      const method = stem.charAt(0).toLowerCase() + stem.slice(1);
      if (method in this)
        throw new TypeError(`The macro ${MacroClass.name} takes the name t.${method}`);
      Object.defineProperty(this, method, {
        value: (...args: never[]) => new MacroClass().apply(this.asBlueprint(), ...args),
      });
    }
  }

  /** This record as the merged `Blueprint`, whose macro members the constructor installed. */
  asBlueprint(): Blueprint {
    // reason: the merged macro members exist at run time (installed above), not on the declared class
    return this as unknown as Blueprint;
  }

  /** See `Blueprint.string`. */
  string(name: string, length?: number): ColumnDefinition {
    if (length === undefined) return this.add(new ColumnRecord(name, "text"));
    if (!Number.isInteger(length) || length < 1 || length > MAX_VARCHAR)
      throw new RangeError(`The length of ${name} must be a whole number from 1, got ${length}`);
    return this.add(new ColumnRecord(name, `varchar(${length})`));
  }

  /** See `Blueprint.integer`. */
  integer(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "integer"));
  }

  /** See `Blueprint.boolean`. */
  boolean(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "boolean"));
  }

  /** See `Blueprint.timestamp`. */
  timestamp(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "timestamptz"));
  }

  /** See `Blueprint.uuid`. */
  uuid(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "uuid"));
  }

  /** See `Blueprint.jsonb`. */
  jsonb(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "jsonb"));
  }

  /**
   * See `Blueprint.enum`.
   *
   * @throws TypeError for no items or a repeated item.
   */
  enum(name: string, values: readonly string[]): ColumnDefinition {
    if (values.length === 0 || new Set(values).size !== values.length)
      throw new TypeError(`The enum ${name} needs distinct items`);
    return this.add(new ColumnRecord(name, "text", { values: Object.freeze([...values]) }));
  }

  /** See `Blueprint.money`. */
  money(name: string): ColumnGroupRecord {
    return new ColumnGroupRecord([
      this.add(new ColumnRecord(`${name}_minor`, "bigint", { suffix: " (minor units)" })),
      this.add(new ColumnRecord(`${name}_currency`, "char(3)", { suffix: " (ISO 4217 code)" })),
    ]);
  }

  /** See `Blueprint.link`. */
  link(column: string): ColumnDefinition {
    return this.add(new ColumnRecord(column, PUBLIC_ID, { indexed: true }));
  }

  /** See `Blueprint.belongsTo`. */
  belongsTo(table: string, options: { readonly column: string }): ColumnRecord {
    quoteIdentifier(table);
    return this.add(
      new ColumnRecord(options.column, PUBLIC_ID, { references: table, indexed: true }),
    );
  }

  /**
   * See `Blueprint.hasPublicId`.
   *
   * @throws TypeError for a prefix that is not 2 to 6 lowercase letters.
   */
  hasPublicId(prefix: string): ColumnGroupRecord {
    if (!PREFIX.test(prefix))
      throw new TypeError(`"${prefix}" is not a public id prefix: 2 to 6 lowercase letters`);
    const id = new ColumnRecord("id", PUBLIC_ID, {
      nullability: "not null",
      comment: `Public id (${prefix}_ and 26 characters of a UUIDv7); the primary key.`,
      primary: true,
    });
    return new ColumnGroupRecord([this.add(id)]);
  }

  /** See `Blueprint.timestamps`. */
  timestamps(): ColumnGroupRecord {
    const stamp = (name: string, comment: string) =>
      this.add(
        new ColumnRecord(name, "timestamptz", {
          nullability: "not null",
          comment,
          defaultSql: "now()",
        }),
      );
    return new ColumnGroupRecord([
      stamp("created_at", "When the row was created."),
      stamp("updated_at", "When the row last changed."),
    ]);
  }

  /** See `Blueprint.userStamps`. */
  userStamps(): ColumnGroupRecord {
    const stamp = (name: string, comment: string) =>
      this.add(new ColumnRecord(name, PUBLIC_ID, { nullability: "null", comment }));
    return new ColumnGroupRecord([
      stamp(
        "created_by",
        "Public id of the principal who created the row; null for a system write.",
      ),
      stamp(
        "updated_by",
        "Public id of the principal who last changed the row; null for a system write.",
      ),
    ]);
  }

  /** See `Blueprint.versioned`. */
  versioned(): ColumnGroupRecord {
    const version = new ColumnRecord("version", "integer", {
      nullability: "not null",
      comment: "Optimistic-lock version, raised by every write; a stale write is a conflict.",
      defaultSql: sqlLiteral(1),
    });
    return new ColumnGroupRecord([this.add(version)]);
  }

  /** See `Blueprint.softDeletes`. */
  softDeletes(): ColumnGroupRecord {
    const deletedAt = new ColumnRecord("deleted_at", "timestamptz", {
      nullability: "null",
      comment: "When the row was soft-deleted; null while it is live.",
    });
    return new ColumnGroupRecord([this.add(deletedAt)]);
  }

  /** See `Blueprint.translatable`. */
  translatable(fields: readonly string[]): ColumnGroupRecord {
    if (fields.length === 0) throw new TypeError("translatable needs at least one field");
    return new ColumnGroupRecord(fields.map((field) => this.add(new ColumnRecord(field, "jsonb"))));
  }

  /** See `Blueprint.index`. */
  index(columns: readonly string[]): TableIndexRecord {
    const index = new TableIndexRecord(columns, false);
    this.indexes.push(index);
    return index;
  }

  /** See `Blueprint.unique`. */
  unique(columns: readonly string[]): TableIndexRecord {
    const index = new TableIndexRecord(columns, true);
    this.indexes.push(index);
    return index;
  }

  /**
   * See `Blueprint.primary`.
   *
   * @throws TypeError when the table already has a primary key, or for no columns.
   */
  primary(columns: readonly string[]): void {
    if (columns.length === 0) throw new TypeError("A primary key needs at least one column");
    if (this.primaryKey !== undefined || this.columns.some((column) => column.primary))
      throw new TypeError(`${this.table} already has a primary key`);
    for (const column of columns) quoteIdentifier(column);
    this.primaryKey = Object.freeze([...columns]);
  }

  /**
   * See `Blueprint.group`.
   *
   * @throws TypeError for a column this blueprint did not write.
   */
  group(...columns: readonly ColumnDefinition[]): ColumnGroupRecord {
    const records = columns.map((column) => {
      if (!(column instanceof ColumnRecord) || !this.columns.includes(column))
        throw new TypeError(`t.group takes columns written on the ${this.table} blueprint`);
      return column;
    });
    return new ColumnGroupRecord(records);
  }

  /**
   * See `Blueprint.rowLevelSecurity`.
   *
   * @throws TypeError for a level that is not snake_case or a level given twice.
   */
  rowLevelSecurity(level: string): void {
    scopeSetting(level);
    if (this.scopes.includes(level))
      throw new TypeError(`${this.table} already has the ${level} policy`);
    this.scopes.push(level);
  }

  /**
   * The statements of this table: the transactional ones in order, then each online index as its own step.
   *
   * @param schema - the module's Postgres schema.
   * @throws TypeError when a column lacks its nullability or comment, or a safety rule above is broken.
   */
  compile(schema: string): {
    readonly statements: readonly CompiledStatement[];
    readonly online: readonly CompiledStep[];
  } {
    const qualified = `${quoteIdentifier(schema)}.${quoteIdentifier(this.table)}`;
    const incomplete = this.columns.filter(
      (column) => column.nullability === undefined || column.commentText === undefined,
    );
    if (incomplete.length > 0)
      throw new TypeError(
        `${this.table}: every column states notNull() or nullable() and has a comment(); not ${incomplete.map((column) => column.name).join(", ")}`,
      );
    return this.creating
      ? this.compileCreate(schema, qualified)
      : this.compileAlter(schema, qualified);
  }

  /** Adds `column`, refusing a repeated name. */
  private add(column: ColumnRecord): ColumnRecord {
    if (this.columns.some((known) => known.name === column.name))
      throw new TypeError(`${this.table} already has a column ${column.name}`);
    this.columns.push(column);
    return column;
  }

  /** `CREATE TABLE` and everything that builds on the new, empty table inside the transaction. */
  private compileCreate(
    schema: string,
    qualified: string,
  ): { readonly statements: CompiledStatement[]; readonly online: CompiledStep[] } {
    const primary =
      this.primaryKey ??
      this.columns.filter((column) => column.primary).map((column) => column.name);
    const definitions = this.columns.map((column) => column.definition(this.table));
    if (primary.length > 0)
      definitions.push(`primary key (${primary.map(quoteIdentifier).join(", ")})`);
    const statements: CompiledStatement[] = [
      {
        sql: `create table ${qualified} (\n  ${definitions.join(",\n  ")}\n)`,
        inverse: [`drop table if exists ${qualified}`],
      },
    ];
    const add = (sql: string | undefined) => {
      if (sql !== undefined) statements.push({ sql, inverse: [] });
    };
    for (const column of this.columns) add(column.commentSql(qualified));
    for (const column of this.columns) add(column.foreignKeySql(schema, this.table, qualified));
    for (const column of this.columns)
      if (column.indexed)
        add(new TableIndexRecord([column.name], false).sql(this.table, qualified, false));
    for (const index of this.indexes) {
      if (index.online)
        throw new TypeError(
          `${index.name(this.table)}: ${this.table} is created by this migration, so its index builds in the transaction; drop concurrently()`,
        );
      add(index.sql(this.table, qualified, false));
    }
    for (const level of this.scopes) for (const sql of this.policySql(qualified, level)) add(sql);
    return { statements, online: [] };
  }

  /** `ALTER TABLE` steps on an existing table, and its indexes as online steps. */
  private compileAlter(
    schema: string,
    qualified: string,
  ): { readonly statements: CompiledStatement[]; readonly online: CompiledStep[] } {
    if (this.primaryKey !== undefined || this.columns.some((column) => column.primary))
      throw new TypeError(
        `${this.table} exists: a primary key is never added to an existing table`,
      );
    const statements: CompiledStatement[] = [];
    const online: CompiledStep[] = [];
    const onlineIndex = (index: TableIndexRecord) =>
      online.push({
        sql: [index.sql(this.table, qualified, true)],
        transactional: false,
        inverse: [
          `drop index concurrently if exists ${quoteIdentifier(schema)}.${quoteIdentifier(index.name(this.table))}`,
        ],
      });
    for (const column of this.columns) {
      if (
        column.nullability === "not null" &&
        column.defaultSql === undefined &&
        column.generated === undefined
      )
        throw new TypeError(
          `${this.table}.${column.name}: an added column is nullable or has a default; NOT NULL without one waits for a contract step`,
        );
      statements.push({
        sql: `alter table ${qualified} add column ${column.definition(this.table)}`,
        inverse: [`alter table ${qualified} drop column if exists ${quoteIdentifier(column.name)}`],
      });
      statements.push({ sql: column.commentSql(qualified), inverse: [] });
      const foreignKey = column.foreignKeySql(schema, this.table, qualified);
      if (foreignKey !== undefined) statements.push({ sql: foreignKey, inverse: [] });
      if (column.indexed) onlineIndex(new TableIndexRecord([column.name], false));
    }
    for (const index of this.indexes) {
      if (!index.online)
        throw new TypeError(
          `${index.name(this.table)}: ${this.table} already exists, so the index is built online; add concurrently()`,
        );
      onlineIndex(index);
    }
    for (const level of this.scopes) {
      const [enable, force, policy] = this.policySql(qualified, level);
      const name = quoteIdentifier(this.policyName(level));
      statements.push(
        { sql: enable, inverse: [`alter table ${qualified} disable row level security`] },
        { sql: force, inverse: [`alter table ${qualified} no force row level security`] },
        { sql: policy, inverse: [`drop policy if exists ${name} on ${qualified}`] },
      );
    }
    return { statements, online };
  }

  /** The policy name of `level`. */
  private policyName(level: string): string {
    return ["pol", this.table, `${level}_id`].join("_");
  }

  /**
   * Enable, force and the equality policy of `level`, which compares `<level>_id` with the transaction's setting.
   *
   * @throws TypeError when the blueprint has no `<level>_id` column.
   */
  private policySql(qualified: string, level: string): readonly [string, string, string] {
    const column = this.columns.find((known) => known.name === `${level}_id`);
    if (column === undefined)
      throw new TypeError(
        `rowLevelSecurity("${level}") needs the ${level}_id column in the same ${this.table} blueprint`,
      );
    const name = quoteIdentifier(this.policyName(level));
    // A setting set earlier in the session reads as '' once its transaction ends, so '' counts as unset (no rows).
    const check = `${quoteIdentifier(column.name)} = nullif(current_setting(${sqlLiteral(scopeSetting(level))}, true), '')::${column.type}`;
    return [
      `alter table ${qualified} enable row level security`,
      `alter table ${qualified} force row level security`,
      `create policy ${name} on ${qualified} using (${check}) with check (${check})`,
    ];
  }
}
