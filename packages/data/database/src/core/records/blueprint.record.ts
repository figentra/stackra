/**
 * Stackra file contract:
 * Purpose: `BlueprintRecord`, the runtime side of `Blueprint` for one table: records columns, column changes, indexes,
 *          the primary key, row-level-security policies and the `AppendOnly` revoke of `UPDATE`, installs the member's macros under their names, and
 *          compiles to SQL statements.
 * Boundary: internal. It enforces the migration safety rules it can see in one table: every column states its
 *           nullability and has a comment; a column added to an existing table is nullable, defaulted or generated;
 *           an index on an existing table is built concurrently in its own step, and one on a table being created
 *           builds in the transaction; no primary key is added to an existing table; a column change (`t.change`) is
 *           made only on an existing table, once per column, and never on a column the same blueprint adds; a foreign
 *           key or enum check added to an existing table is `NOT VALID` in the transaction and validated in a step of
 *           its own after it, so no long lock is held while the rows are scanned (stackra-251).
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3; as amended by ADR 0305); ADR 0239 (equality policy; `equalsOrUnset`,
 *                     STA-1300); ADR 0327 (decisions 3 and 9: scope-tree columns, isolation in the database); ADR 0412 (inherited rows, read only);
 *                     `.agents/rules/tenancy.md`; ADR 0231 (names); ADR 0135 (public ids); ADR 0294 (decision 28: links).
 */
import { constraintName } from "#core/functions/constraint-name.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";
import { ColumnRecord } from "#core/records/column.record";
import { PUBLIC_ID_TEXT } from "#core/constants/public-id-text.constant";
import { ColumnChangeRecord } from "#core/records/column-change.record";
import { ColumnGroupRecord } from "#core/records/column-group.record";
import { TableIndexRecord } from "#core/records/table-index.record";
import type { Blueprint } from "#core/types/blueprint.type";
import type { ColumnChange } from "#core/types/column-change.type";
import type { ColumnDefinition } from "#core/types/column-definition.type";
import type { CompiledStatement } from "#core/types/compiled-statement.type";
import type { CompiledStep } from "#core/types/compiled-step.type";
import type { MacroClass } from "#core/types/macro-class.type";
import type { RowLevelSecurityOptions } from "#core/types/row-level-security-options.type";

/** A public id prefix: 2 to 6 lowercase letters. */
const PREFIX = /^[a-z]{2,6}$/;

/** The longest `varchar` Postgres takes. */
const MAX_VARCHAR = 10_485_760;

/** The largest `numeric` precision Postgres takes. */
const MAX_NUMERIC_PRECISION = 1000;

/** A custom setting: `<prefix>.<name>`, snake_case. */
const SETTING = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** The ways a policy matches its column with the setting. */
const MATCHES: readonly RowLevelSecurityOptions["match"][] = [
  "equals",
  "equalsOrUnset",
  "ancestor",
  "inherited",
];

/** The matches on an id column; the others are on an `ltree` path column. */
const ID_MATCHES: ReadonlySet<RowLevelSecurityOptions["match"]> = new Set([
  "equals",
  "equalsOrUnset",
]);

/** A declared row-level-security policy. */
interface PolicySeed {
  readonly column: string;
  readonly options: RowLevelSecurityOptions;
}

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

  /** The changes of existing columns, in the order they were written. */
  private readonly changes: ColumnChangeRecord[] = [];

  /** The indexes, in the order they were written. */
  private readonly indexes: TableIndexRecord[] = [];

  /** The column and options of the row-level-security policy, when one was declared. */
  private policy: PolicySeed | undefined = undefined;

  /** The composite primary key, when one was declared. */
  private primaryKey: readonly string[] | undefined = undefined;

  /** The SQL type of a public-id key column (`hasPublicId`, `belongsTo`, `link`). */
  private readonly publicIdColumn: string;

  /** Whether `appendOnly` was called: the table's `UPDATE` is revoked. */
  private appendOnlyTable = false;

  /** The range-partition column, when `partitionBy` was called. */
  private partitionColumn: string | undefined = undefined;

  /**
   * @param table - the table name, snake_case.
   * @param creating - true for `schema.create`, false for `schema.table`.
   * @param macros - the macros to install as methods.
   * @param publicIdColumn - the SQL type of a public-id key column (`uuid` or `varchar(33)`).
   * @throws TypeError for a table name that is not snake_case, a macro class not named `<Name>Macro`, or a macro whose
   *         name a built-in method already has.
   */
  constructor(
    table: string,
    creating: boolean,
    macros: readonly MacroClass[],
    publicIdColumn: string = PUBLIC_ID_TEXT,
  ) {
    quoteIdentifier(table);
    this.table = table;
    this.creating = creating;
    this.publicIdColumn = publicIdColumn;
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

  /** Implements `Blueprint.string`, documented there. */
  string(name: string, length?: number): ColumnDefinition {
    if (length === undefined) return this.add(new ColumnRecord(name, "text"));
    if (!Number.isInteger(length) || length < 1 || length > MAX_VARCHAR)
      throw new RangeError(`The length of ${name} must be a whole number from 1, got ${length}`);
    return this.add(new ColumnRecord(name, `varchar(${length})`));
  }

  /** Implements `Blueprint.integer`, documented there. */
  integer(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "integer"));
  }

  /** Implements `Blueprint.bigint`, documented there. */
  bigint(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "bigint"));
  }

  /**
   * Implements `Blueprint.decimal`, documented there.
   *
   * @throws RangeError for a precision outside 1 to 1000 or a scale outside 0 to the precision.
   */
  decimal(name: string, precision: number, scale: number): ColumnDefinition {
    if (!Number.isInteger(precision) || precision < 1 || precision > MAX_NUMERIC_PRECISION)
      throw new RangeError(
        `The precision of ${name} must be a whole number from 1 to 1000, got ${precision}`,
      );
    if (!Number.isInteger(scale) || scale < 0 || scale > precision)
      throw new RangeError(
        `The scale of ${name} must be a whole number from 0 to ${precision}, got ${scale}`,
      );
    return this.add(new ColumnRecord(name, `numeric(${precision}, ${scale})`));
  }

  /** Implements `Blueprint.boolean`, documented there. */
  boolean(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "boolean"));
  }

  /** Implements `Blueprint.timestamp`, documented there. */
  timestamp(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "timestamptz"));
  }

  /** Implements `Blueprint.uuid`, documented there. */
  uuid(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "uuid"));
  }

  /** Implements `Blueprint.jsonb`, documented there. */
  jsonb(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "jsonb"));
  }

  /** Implements `Blueprint.tsvector`, documented there. */
  tsvector(name: string): ColumnDefinition {
    return this.add(new ColumnRecord(name, "tsvector"));
  }

  /**
   * Implements `Blueprint.enum`, documented there.
   *
   * @throws TypeError for no items or a repeated item.
   */
  enum(name: string, values: readonly string[]): ColumnDefinition {
    if (values.length === 0 || new Set(values).size !== values.length)
      throw new TypeError(`The enum ${name} needs distinct items`);
    return this.add(new ColumnRecord(name, "text", { values: Object.freeze([...values]) }));
  }

  /** Implements `Blueprint.money`, documented there. */
  money(name: string): ColumnGroupRecord {
    return new ColumnGroupRecord([
      this.add(new ColumnRecord(`${name}_minor`, "bigint", { suffix: " (minor units)" })),
      this.add(new ColumnRecord(`${name}_currency`, "char(3)", { suffix: " (ISO 4217 code)" })),
    ]);
  }

  /** Implements `Blueprint.link`, documented there. */
  link(column: string): ColumnDefinition {
    return this.add(new ColumnRecord(column, this.publicIdColumn, { indexed: true }));
  }

  /** Implements `Blueprint.belongsTo`, documented there. */
  belongsTo(table: string, options: { readonly column: string }): ColumnRecord {
    quoteIdentifier(table);
    return this.add(
      new ColumnRecord(options.column, this.publicIdColumn, { references: table, indexed: true }),
    );
  }

  /**
   * Implements `Blueprint.hasPublicId`, documented there.
   *
   * @throws TypeError for a prefix that is not 2 to 6 lowercase letters.
   */
  hasPublicId(prefix: string): ColumnGroupRecord {
    if (!PREFIX.test(prefix))
      throw new TypeError(`"${prefix}" is not a public id prefix: 2 to 6 lowercase letters`);
    const id = new ColumnRecord("id", this.publicIdColumn, {
      nullability: "not null",
      comment: `Public id (${prefix}_ and 26 characters of a UUIDv7); the primary key.`,
      primary: true,
    });
    return new ColumnGroupRecord([this.add(id)]);
  }

  /** Implements `Blueprint.timestamps`, documented there. */
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

  /** Implements `Blueprint.userStamps`, documented there. */
  userStamps(): ColumnGroupRecord {
    const stamp = (name: string, comment: string) =>
      this.add(new ColumnRecord(name, PUBLIC_ID_TEXT, { nullability: "null", comment }));
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

  /** Implements `Blueprint.versioned`, documented there. */
  versioned(): ColumnGroupRecord {
    const version = new ColumnRecord("version", "integer", {
      nullability: "not null",
      comment: "Optimistic-lock version, raised by every write; a stale write is a conflict.",
      defaultSql: sqlLiteral(1),
    });
    return new ColumnGroupRecord([this.add(version)]);
  }

  /** Implements `Blueprint.softDeletes`, documented there. */
  softDeletes(): ColumnGroupRecord {
    const deletedAt = new ColumnRecord("deleted_at", "timestamptz", {
      nullability: "null",
      comment: "When the row was soft-deleted; null while it is live.",
    });
    return new ColumnGroupRecord([this.add(deletedAt)]);
  }

  /** Implements `Blueprint.archivable`, documented there. */
  archivable(): ColumnGroupRecord {
    const archivedAt = new ColumnRecord("archived_at", "timestamptz", {
      nullability: "null",
      comment: "When the row was archived; null while it is active.",
    });
    return new ColumnGroupRecord([this.add(archivedAt)]);
  }

  /** Implements `Blueprint.appendOnly`, documented there. */
  appendOnly(): void {
    this.appendOnlyTable = true;
  }

  /**
   * Implements `Blueprint.partitionBy`, documented there.
   *
   * @throws TypeError on an existing table, for a second call, or for a column name that is not snake_case.
   */
  partitionBy(column: string, options: { readonly brin?: boolean } = {}): void {
    quoteIdentifier(column);
    if (!this.creating)
      throw new TypeError(
        `${this.table} exists: only a new table is partitioned (Postgres cannot convert one)`,
      );
    if (this.partitionColumn !== undefined)
      throw new TypeError(`${this.table} is already partitioned by ${this.partitionColumn}`);
    this.partitionColumn = column;
    if (options.brin !== false) this.index([column]).using("brin");
  }

  /** Implements `Blueprint.translatable`, documented there. */
  translatable(fields: readonly string[]): ColumnGroupRecord {
    if (fields.length === 0) throw new TypeError("translatable needs at least one field");
    return new ColumnGroupRecord(fields.map((field) => this.add(new ColumnRecord(field, "jsonb"))));
  }

  /**
   * Implements `Blueprint.change`, documented there.
   *
   * @throws TypeError on a table being created, for a name that is not snake_case, or for a column already changed.
   */
  change(column: string): ColumnChange {
    if (this.creating)
      throw new TypeError(
        `${this.table} is created by this migration: define ${column} as it should be instead of changing it`,
      );
    if (this.changes.some((known) => known.name === column))
      throw new TypeError(`${this.table}.${column} is already changed in this blueprint`);
    const change = new ColumnChangeRecord(column);
    this.changes.push(change);
    return change;
  }

  /** Implements `Blueprint.index`, documented there. */
  index(columns: readonly string[]): TableIndexRecord {
    const index = new TableIndexRecord(columns, false);
    this.indexes.push(index);
    return index;
  }

  /** Implements `Blueprint.unique`, documented there. */
  unique(columns: readonly string[]): TableIndexRecord {
    const index = new TableIndexRecord(columns, true);
    this.indexes.push(index);
    return index;
  }

  /**
   * Implements `Blueprint.primary`, documented there.
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
   * Implements `Blueprint.group`, documented there.
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

  /** Implements `Blueprint.scopeId`, documented there. */
  scopeId(): ColumnDefinition {
    return this.link("scope_id");
  }

  /** Implements `Blueprint.scopePath`, documented there. */
  scopePath(): ColumnDefinition {
    const column = this.add(new ColumnRecord("scope_path", "ltree"));
    const index = this.index([column.name]).using("gist");
    if (!this.creating) index.concurrently();
    return column;
  }

  /**
   * Implements `Blueprint.rowLevelSecurity`, documented there.
   *
   * @throws TypeError for a column that is not snake_case, a setting that is not `<prefix>.<name>`, an unknown match,
   *         or a second policy.
   */
  rowLevelSecurity(column: string, options: RowLevelSecurityOptions): void {
    quoteIdentifier(column);
    if (!SETTING.test(options.setting))
      throw new TypeError(`"${options.setting}" is not a custom setting: <prefix>.<name>`);
    if (!MATCHES.includes(options.match))
      throw new TypeError(`"${options.match}" is not a policy match (${MATCHES.join(", ")})`);
    // Postgres ORs permissive policies, so a second one would widen what the first lets a session see.
    if (this.policy !== undefined)
      throw new TypeError(
        `${this.table} already has the ${this.policy.column} policy; a table takes one, as Postgres ORs them`,
      );
    this.policy = { column, options };
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

  /**
   * Refuses a partitioning Postgres would refuse: the column must be a NOT NULL column of this blueprint, and every
   * unique index must include it.
   *
   * @throws TypeError naming the broken rule.
   */
  private checkPartition(partition: string): void {
    const column = this.columns.find((candidate) => candidate.name === partition);
    if (column?.nullability !== "not null")
      throw new TypeError(
        `${this.table} is partitioned by ${partition}, which must be a NOT NULL column of this blueprint`,
      );
    for (const index of this.indexes)
      if (index.unique && !index.columns.includes(partition))
        throw new TypeError(
          `${index.name(this.table)}: a unique index of a partitioned table includes ${partition}`,
        );
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
    const declared =
      this.primaryKey ??
      this.columns.filter((column) => column.primary).map((column) => column.name);
    const partition = this.partitionColumn;
    if (partition !== undefined) this.checkPartition(partition);
    // Postgres requires a partitioned table's primary key to include the partition column.
    const primary =
      partition === undefined || declared.length === 0 || declared.includes(partition)
        ? declared
        : [...declared, partition];
    const definitions = this.columns.map((column) => column.definition(this.table, schema));
    if (primary.length > 0)
      definitions.push(`primary key (${primary.map(quoteIdentifier).join(", ")})`);
    const partitioned =
      partition === undefined ? "" : ` partition by range (${quoteIdentifier(partition)})`;
    const statements: CompiledStatement[] = [
      {
        sql: `create table ${qualified} (\n  ${definitions.join(",\n  ")}\n)${partitioned}`,
        inverse: [`drop table if exists ${qualified}`],
      },
    ];
    if (partition !== undefined)
      statements.push({
        sql: `create table ${quoteIdentifier(schema)}.${quoteIdentifier(`${this.table}_default`)} partition of ${qualified} default`,
        inverse: [],
      });
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
    if (this.policy !== undefined)
      for (const { sql } of this.policySql(qualified, this.policy)) add(sql);
    statements.push(...this.appendOnlySql(qualified));
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
    const added = new Set(this.columns.map((column) => column.name));
    const statements: CompiledStatement[] = [];
    for (const change of this.changes) {
      if (added.has(change.name))
        throw new TypeError(
          `${this.table}.${change.name} is added by this blueprint, so it is defined, not changed`,
        );
      statements.push(...change.statements(qualified));
    }
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
        sql: `alter table ${qualified} add column ${column.definition(this.table, schema, false)}`,
        inverse: [`alter table ${qualified} drop column if exists ${quoteIdentifier(column.name)}`],
      });
      statements.push({ sql: column.commentSql(qualified), inverse: [] });
      for (const constraint of [
        column.foreignKeySql(schema, this.table, qualified, true),
        column.checkSql(this.table, qualified),
      ])
        if (constraint !== undefined) statements.push({ sql: constraint, inverse: [] });
      if (column.indexed) onlineIndex(new TableIndexRecord([column.name], false));
    }
    for (const index of this.indexes) {
      if (!index.online)
        throw new TypeError(
          `${index.name(this.table)}: ${this.table} already exists, so the index is built online; add concurrently()`,
        );
      onlineIndex(index);
    }
    // Validation takes SHARE UPDATE EXCLUSIVE, so writes go on while it scans; dropping the column undoes it.
    for (const column of this.columns)
      for (const validate of column.validateSql(this.table, qualified))
        online.push({ sql: [validate], transactional: true, inverse: [] });
    if (this.policy !== undefined) statements.push(...this.policySql(qualified, this.policy));
    statements.push(...this.appendOnlySql(qualified));
    return { statements, online };
  }

  /** The revoke of `UPDATE` on an `appendOnly` table, with its grant back as the inverse; none otherwise. */
  private appendOnlySql(qualified: string): readonly CompiledStatement[] {
    if (!this.appendOnlyTable) return [];
    return [
      {
        sql: `revoke update on ${qualified} from public, current_user`,
        inverse: [`grant update on ${qualified} to current_user`],
      },
    ];
  }

  /**
   * Enable, force and the policies on the column `name`, each with its inverse: equal to the transaction's setting, or
   * an `ltree` column at or below one of the setting's `|`-separated paths; `inherited` adds a select-only policy
   * (`pol_<table>_<column>_inherited`) for the rows on the path above a granted path.
   *
   * @throws TypeError when the blueprint has no such column, or a path match is on a column that is not `ltree`.
   */
  private policySql(
    qualified: string,
    { column: name, options }: PolicySeed,
  ): readonly CompiledStatement[] {
    const column = this.columns.find((known) => known.name === name);
    if (column === undefined)
      throw new TypeError(
        `rowLevelSecurity("${name}") needs the ${name} column in the same ${this.table} blueprint`,
      );
    if (!ID_MATCHES.has(options.match) && column.type !== "ltree")
      throw new TypeError(
        `${this.table}.${name} is not ltree, so it takes no ${options.match} match`,
      );
    const setting = `current_setting(${sqlLiteral(options.setting)}, true)`;
    const granted = `unnest(string_to_array(${setting}, '|')) as granted`;
    // A setting set earlier in the session reads as '' once its transaction ends, so '' counts as unset (no rows).
    // `?` over an lquery array (`<path>.*` is the path and every descendant) is GiST-indexable where `<@ any(...)`
    // seq-scans, and a policy cannot OR-expand a list of unknown length; '' or unset gives an empty array (no rows).
    // `equalsOrUnset` also lets a session with the setting unset see the rows whose column is null (a nullable scope
    // column: platform rows); a scoped session still sees only its own. `is not distinct from` is `=` with null = null.
    const check =
      options.match === "equals"
        ? `${quoteIdentifier(name)} = nullif(${setting}, '')::${column.type}`
        : options.match === "equalsOrUnset"
          ? `${quoteIdentifier(name)} is not distinct from nullif(${setting}, '')::${column.type}`
          : `${quoteIdentifier(name)} ? array(select (granted || '.*')::lquery from ${granted})`;
    const policy = quoteIdentifier(constraintName("pol", this.table, [name]));
    const statements: CompiledStatement[] = [
      {
        sql: `alter table ${qualified} enable row level security`,
        inverse: [`alter table ${qualified} disable row level security`],
      },
      {
        sql: `alter table ${qualified} force row level security`,
        inverse: [`alter table ${qualified} no force row level security`],
      },
      {
        sql: `create policy ${policy} on ${qualified} using (${check}) with check (${check})`,
        inverse: [`drop policy if exists ${policy} on ${qualified}`],
      },
    ];
    if (options.match === "inherited") {
      // Permissive policies OR per command, so a select-only policy widens reads and never writes: update, delete and
      // insert still pass only the policy above. `ltree @> ltree[]` is true when the row's path is an ancestor of, or
      // equal to, one of the granted paths; the tables that take it hold few rows, so the array scan is cheap.
      const inherited = quoteIdentifier(constraintName("pol", this.table, [name, "inherited"]));
      statements.push({
        sql: `create policy ${inherited} on ${qualified} for select using (${quoteIdentifier(name)} @> array(select granted::ltree from ${granted}))`,
        inverse: [`drop policy if exists ${inherited} on ${qualified}`],
      });
    }
    return statements;
  }
}
