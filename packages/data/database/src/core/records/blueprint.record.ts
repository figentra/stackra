/**
 * Stackra file contract:
 * Purpose: `BlueprintRecord`, the runtime side of `Blueprint` for one table: records columns, column changes, indexes,
 *          the primary key, row-level-security policies and the `AppendOnly` revoke of `UPDATE`, installs the member's macros under their names, and
 *          compiles to SQL statements. A `platformTable` or `reviewedPolicy` declaration compiles to its marker line
 *          (`TABLE_DECLARATION_MARKERS`) first; a `systemAccess` one to its marker line, the system-access role, its
 *          column grants and its role-scoped policies last.
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
 *                     `.agents/rules/tenancy.md`; ADR 0231 (names); ADR 0135 (public ids); ADR 0294 (decision 28: links);
 *                     ADR 0321 (`HasTree`: `t.tree()`; `HasMetadata`: `t.metadata()`).
 */
import { constraintName } from "#core/functions/constraint-name.function";
import { declarationReason } from "#core/functions/declaration-reason.function";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";
import { systemAccessRoleSql } from "#core/functions/system-access-role-sql.function";
import { ColumnRecord } from "#core/records/column.record";
import { TABLE_DECLARATION_MARKERS } from "#core/constants/table-declaration-markers.constant";
import { PUBLIC_ID_TEXT } from "#core/constants/public-id-text.constant";
import { SYSTEM_ACCESS_ROLE } from "#core/constants/system-access-role.constant";
import { ColumnChangeRecord } from "#core/records/column-change.record";
import { ColumnGroupRecord } from "#core/records/column-group.record";
import { TableIndexRecord } from "#core/records/table-index.record";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SystemAccessOptions } from "#core/types/system-access-options.type";
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

/** The reason and the squawk ignore written above an added column whose default is a setting (no table rewrite). */
const SETTING_DEFAULT_SQUAWK_IGNORE =
  "-- lint: current_setting() is STABLE, so Postgres 11+ adds this column without rewriting the table.\n" +
  "-- squawk-ignore adding-field-with-default\n";

/** A custom setting: `<prefix>.<name>`, snake_case. */
const SETTING = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** The ways a policy matches its column with the setting. */
const MATCHES: readonly RowLevelSecurityOptions["match"][] = [
  "equals",
  "equalsOrUnset",
  "platform",
  "ancestor",
  "inherited",
];

/** The matches on an id column; the others are on an `ltree` path column. */
const ID_MATCHES: ReadonlySet<RowLevelSecurityOptions["match"]> = new Set([
  "equals",
  "equalsOrUnset",
  "platform",
]);

/** The matches that write more than one policy, so they are never restrictive and never dropped here. */
const COMPOUND_MATCHES: ReadonlySet<RowLevelSecurityOptions["match"]> = new Set([
  "inherited",
  "platform",
]);

/**
 * The `uuid` a setting value names: a public id (`scp_` and 26 Crockford base32 characters, as `withTenant` writes it)
 * is decoded to the UUID its body encodes, which is what a public-id column stores under `publicIds: "uuid"`; any other
 * value is cast as it is. The 130 bits are 26 five-bit groups, the top 2 always zero, so bits 3 to 130 are the UUID.
 * The subquery reads no row, so Postgres runs it once per statement and the equality stays indexable.
 */
function uuidOf(value: string): string {
  const bits = `(select string_agg((strpos('0123456789abcdefghjkmnpqrstvwxyz', c) - 1)::bit(5)::text, '' order by n) from unnest(string_to_array(split_part(${value}, '_', 2), null)) with ordinality as body(c, n))`;
  const half = (from: number) =>
    `lpad(to_hex(substr(${bits}, ${from}, 64)::bit(64)::bigint), 16, '0')`;
  return `(case when strpos(${value}, '_') > 0 then ${half(3)} || ${half(67)} else ${value} end)::uuid`;
}

/** The paths of a `|`-separated path setting, one per row, as `granted`. */
const grantedPaths = (setting: string): string =>
  `unnest(string_to_array(current_setting(${sqlLiteral(setting)}, true), '|')) as granted`;

/**
 * Refuses a policy column that is not snake_case, a setting that is not `<prefix>.<name>` or an unknown match.
 *
 * @throws TypeError naming the broken rule.
 */
function checkPolicy(column: string, options: RowLevelSecurityOptions): void {
  quoteIdentifier(column);
  if (!SETTING.test(options.setting))
    throw new TypeError(`"${options.setting}" is not a custom setting: <prefix>.<name>`);
  if (!MATCHES.includes(options.match))
    throw new TypeError(`"${options.match}" is not a policy match (${MATCHES.join(", ")})`);
}

/** A declared row-level-security policy. */
interface PolicySeed {
  readonly column: string;
  readonly options: RowLevelSecurityOptions;
}

/** A policy an earlier migration created, dropped here; `table` is the name it was created under. */
interface DroppedPolicy extends PolicySeed {
  readonly table: string;
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

  /** The row-level-security policies declared: at most one permissive, and restrictive ones. */
  private readonly policies: PolicySeed[] = [];

  /** The policies of earlier migrations this blueprint drops. */
  private readonly dropped: DroppedPolicy[] = [];

  /** The composite primary key, when one was declared. */
  private primaryKey: readonly string[] | undefined = undefined;

  /** The SQL type of a public-id key column (`hasPublicId`, `belongsTo`, `link`). */
  private readonly publicIdColumn: string;

  /** Whether `appendOnly` was called: the table's `UPDATE` is revoked. */
  private appendOnlyTable = false;

  /** The range-partition column, when `partitionBy` was called. */
  private partitionColumn: string | undefined = undefined;

  /** The reason of `platformTable`, when declared. */
  private platformReason: string | undefined = undefined;

  /** The policies and reason of `reviewedPolicy`, when declared. */
  private review: { readonly policies: readonly string[]; readonly reason: string } | undefined =
    undefined;

  /** The columns and reason of `systemAccess`, when declared. */
  private systemGrant:
    | {
        readonly select: readonly string[];
        readonly update: readonly string[];
        readonly reason: string;
      }
    | undefined = undefined;

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

  /** Implements `Blueprint.point`, documented there. */
  point(name: string): ColumnDefinition {
    return this.geography(name, "Point");
  }

  /** Implements `Blueprint.polygon`, documented there. */
  polygon(name: string): ColumnDefinition {
    return this.geography(name, "Polygon");
  }

  /** Implements `Blueprint.line`, documented there. */
  line(name: string): ColumnDefinition {
    return this.geography(name, "LineString");
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

  /** Implements `Blueprint.tree`, documented there. */
  tree(): ColumnGroupRecord {
    const parent = this.add(
      new ColumnRecord("parent_id", this.publicIdColumn, {
        indexed: true,
        nullability: "null",
        comment: "The parent record's id; null for a root.",
      }),
    );
    // An existing table's rows have no path until a backfill writes one, so the column starts nullable there.
    const path = this.add(
      new ColumnRecord("tree_path", "ltree", {
        nullability: this.creating ? "not null" : "null",
        comment: "The path from the root to this record, kept by the database layer.",
      }),
    );
    const index = this.index([path.name]).using("gist");
    if (!this.creating) index.concurrently();
    return new ColumnGroupRecord([parent, path]);
  }

  /** Implements `Blueprint.metadata`, documented there. */
  metadata(options: { readonly index?: boolean } = {}): ColumnGroupRecord {
    const metadata = this.add(
      new ColumnRecord("metadata", "jsonb", {
        nullability: "not null",
        comment: "String keys to string values, at most 16 KB; never a secret or classified data.",
        defaultSql: "'{}'::jsonb",
      }),
    );
    if (options.index === true) {
      const index = this.index([metadata.name]).using("gin");
      if (!this.creating) index.concurrently();
    }
    return new ColumnGroupRecord([metadata]);
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
   *         a second permissive policy, a second policy on one column, or a restrictive `inherited` match.
   */
  rowLevelSecurity(column: string, options: RowLevelSecurityOptions): void {
    checkPolicy(column, options);
    if (options.restrictive === true && COMPOUND_MATCHES.has(options.match))
      throw new TypeError(
        `${this.table}.${column}: an ${options.match} match widens reads, so it is never restrictive`,
      );
    if (options.exemptNull !== undefined && options.restrictive !== true)
      throw new TypeError(`${this.table}.${column}: exemptNull is for a restrictive policy only`);
    if (options.exemptNull !== undefined) quoteIdentifier(options.exemptNull);
    if (options.exemptNull !== undefined && ID_MATCHES.has(options.match))
      throw new TypeError(`${this.table}.${column}: exemptNull is for a path match only`);
    // Postgres ORs permissive policies, so a second one would widen what the first lets a session see.
    const permissive = this.policies.find((policy) => policy.options.restrictive !== true);
    if (options.restrictive !== true && permissive !== undefined)
      throw new TypeError(
        `${this.table} already has the ${permissive.column} policy; a table takes one permissive policy, as Postgres ORs them`,
      );
    if (this.policies.some((policy) => policy.column === column))
      throw new TypeError(`${this.table} already has a policy on ${column}`);
    this.policies.push({ column, options });
  }

  /**
   * Implements `Blueprint.dropRowLevelSecurity`, documented there.
   *
   * @throws TypeError on a table being created, for an `inherited` match, or for the checks of `rowLevelSecurity`.
   */
  dropRowLevelSecurity(
    column: string,
    options: RowLevelSecurityOptions & { readonly table?: string },
  ): void {
    if (this.creating)
      throw new TypeError(
        `${this.table} is created by this migration, so it has no policy to drop`,
      );
    checkPolicy(column, options);
    if (COMPOUND_MATCHES.has(options.match))
      throw new TypeError(
        `${this.table}.${column}: dropping an ${options.match} policy is not supported`,
      );
    this.dropped.push({ column, options, table: options.table ?? this.table });
  }

  /**
   * Implements `Blueprint.platformTable`, documented there.
   *
   * @throws TypeError for an empty reason, or a second declaration on this blueprint.
   */
  platformTable(reason: string): void {
    const text = declarationReason("t.platformTable", reason);
    if (this.platformReason !== undefined || this.review !== undefined)
      throw new TypeError(`${this.table} already declares its row security`);
    this.platformReason = text;
  }

  /**
   * Implements `Blueprint.reviewedPolicy`, documented there.
   *
   * @throws TypeError for an empty reason, no policy, a policy name that is not snake_case, or a second declaration.
   */
  reviewedPolicy(reason: string, policies: readonly string[]): void {
    const text = declarationReason("t.reviewedPolicy", reason);
    if (!Array.isArray(policies) || policies.length === 0)
      throw new TypeError(`t.reviewedPolicy on ${this.table} names the policies it reviewed`);
    for (const policy of policies) quoteIdentifier(policy);
    if (this.platformReason !== undefined || this.review !== undefined)
      throw new TypeError(`${this.table} already declares its row security`);
    this.review = { policies: [...policies], reason: text };
  }

  /**
   * Implements `Blueprint.systemAccess`, documented there.
   *
   * @throws TypeError for an empty reason, no `select` column, a column name that is not snake_case, or a second
   *         declaration.
   */
  systemAccess(options: SystemAccessOptions): void {
    const reason = declarationReason("t.systemAccess", options?.reason);
    const select = [...(options.select ?? [])];
    const update = [...(options.update ?? [])];
    if (select.length === 0)
      throw new TypeError(`t.systemAccess on ${this.table} names the columns the role reads`);
    for (const column of [...select, ...update]) quoteIdentifier(column);
    if (this.systemGrant !== undefined)
      throw new TypeError(`${this.table} already declares its system access`);
    this.systemGrant = { select, update, reason };
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
    const compiled = this.creating
      ? this.compileCreate(schema, qualified)
      : this.compileAlter(schema, qualified);
    return {
      statements: [
        ...this.declarationSql(schema),
        ...compiled.statements,
        ...this.systemAccessSql(schema, qualified),
      ],
      online: compiled.online,
    };
  }

  /**
   * The `systemAccess` marker line, the role, its column grants and its role-scoped policies, each with its inverse;
   * none otherwise. The schema `USAGE` stays on a down: another table of the schema may still need it.
   *
   * @throws TypeError on a platform table, which no tenant owns.
   */
  private systemAccessSql(schema: string, qualified: string): CompiledStatement[] {
    const grant = this.systemGrant;
    if (grant === undefined) return [];
    if (this.platformReason !== undefined)
      throw new TypeError(
        `${this.table} is declared a platform table, which no tenant owns, so it takes no t.systemAccess`,
      );
    const role = quoteIdentifier(SYSTEM_ACCESS_ROLE);
    const update = grant.update.length > 0 ? ` update=${grant.update.join(",")}` : "";
    const statements: CompiledStatement[] = [
      {
        sql: `${TABLE_DECLARATION_MARKERS.systemAccess} ${schema}.${this.table} select=${grant.select.join(",")}${update} ${grant.reason}`,
        inverse: [],
      },
      systemAccessRoleSql(),
      { sql: `grant usage on schema ${quoteIdentifier(schema)} to ${role}`, inverse: [] },
    ];
    for (const [command, columns] of [
      ["select", grant.select],
      ["update", grant.update],
    ] as const) {
      if (columns.length === 0) continue;
      const list = columns.map(quoteIdentifier).join(", ");
      const policy = quoteIdentifier(constraintName("pol", this.table, ["system_access", command]));
      statements.push(
        {
          sql: `grant ${command} (${list}) on ${qualified} to ${role}`,
          inverse: [`revoke ${command} (${list}) on ${qualified} from ${role}`],
        },
        {
          sql: `create policy ${policy} on ${qualified} for ${command} to ${role} using (true)${command === "update" ? " with check (true)" : ""}`,
          inverse: [`drop policy if exists ${policy} on ${qualified}`],
        },
      );
    }
    return statements;
  }

  /**
   * The marker line of `platformTable` or `reviewedPolicy`, which the compiled migration carries for the audit.
   *
   * @throws TypeError for a platform table that holds an owner column: a scope or isolation scope id, a column filled
   *         from a setting, or a policy of its own.
   */
  private declarationSql(schema: string): CompiledStatement[] {
    if (this.platformReason !== undefined) {
      const owner = this.columns.find(
        (column) =>
          ["scope_id", "isolation_scope_id"].includes(column.name) ||
          column.defaultSql?.startsWith("nullif(current_setting(") === true,
      );
      if (owner !== undefined || this.policies.length > 0)
        throw new TypeError(
          `${this.table} is declared a platform table, so it holds no owner column or policy; not ${owner?.name ?? `the ${this.policies[0]?.column} policy`}`,
        );
      return [
        {
          sql: `${TABLE_DECLARATION_MARKERS.platformTable} ${schema}.${this.table} ${this.platformReason}`,
          inverse: [],
        },
      ];
    }
    if (this.review !== undefined)
      return [
        {
          sql: `${TABLE_DECLARATION_MARKERS.reviewedPolicy} ${schema}.${this.table} ${this.review.policies.join(",")} ${this.review.reason}`,
          inverse: [],
        },
      ];
    return [];
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

  /** A WGS 84 `geography` column of `shape` with its GiST index, online on an existing table (ADR 0314). */
  private geography(name: string, shape: "Point" | "Polygon" | "LineString"): ColumnDefinition {
    const column = this.add(new ColumnRecord(name, `geography(${shape},4326)`));
    const index = this.index([column.name]).using("gist");
    if (!this.creating) index.concurrently();
    return column;
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
      if (column.indexed && !this.declaresIndexOn(column.name))
        add(new TableIndexRecord([column.name], false).sql(this.table, qualified, false));
    for (const index of this.indexes) {
      if (index.online)
        throw new TypeError(
          `${index.name(this.table)}: ${this.table} is created by this migration, so its index builds in the transaction; drop concurrently()`,
        );
      add(index.sql(this.table, qualified, false));
    }
    for (const { sql } of this.rowSecuritySql(qualified)) add(sql);
    statements.push(...this.appendOnlySql(qualified));
    return { statements, online: [] };
  }

  /**
   * Whether the blueprint declares an index on `column` alone (`t.unique(["scope_id"])` beside `t.scopeId()`): that
   * index serves the column, so its own plain index is not written, which would take the same `idx_` name.
   */
  private declaresIndexOn(column: string): boolean {
    return this.indexes.some((index) => index.columns.length === 1 && index.columns[0] === column);
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
      // A setting default calls current_setting(), which is STABLE: Postgres 11+ adds the column without a rewrite, which
      // squawk cannot see, so the statement carries its own ignore and reason for every host's lint.
      const settingDefault = column.defaultSql?.startsWith("nullif(current_setting(") === true;
      statements.push({
        sql:
          (settingDefault ? SETTING_DEFAULT_SQUAWK_IGNORE : "") +
          `alter table ${qualified} add column ${column.definition(this.table, schema, false)}`,
        inverse: [`alter table ${qualified} drop column if exists ${quoteIdentifier(column.name)}`],
      });
      statements.push({ sql: column.commentSql(qualified), inverse: [] });
      for (const constraint of [
        column.foreignKeySql(schema, this.table, qualified, true),
        column.checkSql(this.table, qualified),
      ])
        if (constraint !== undefined) statements.push({ sql: constraint, inverse: [] });
      if (column.indexed && !this.declaresIndexOn(column.name))
        onlineIndex(new TableIndexRecord([column.name], false));
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
    statements.push(...this.rowSecuritySql(qualified));
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
   * The dropped policies, then enable, force and each declared policy, each with its inverse. A table whose policy
   * this blueprint drops had row-level security already, so its enable and force undo nothing.
   */
  private rowSecuritySql(qualified: string): readonly CompiledStatement[] {
    const statements: CompiledStatement[] = this.dropped.map((dropped) => {
      const policy = quoteIdentifier(constraintName("pol", dropped.table, [dropped.column]));
      return {
        sql: `drop policy ${policy} on ${qualified}`,
        inverse: [this.createPolicySql(qualified, policy, dropped)],
      };
    });
    if (this.policies.length === 0) return statements;
    const undo = (sql: string) => (this.dropped.length > 0 ? [] : [sql]);
    statements.push(
      {
        sql: `alter table ${qualified} enable row level security`,
        inverse: undo(`alter table ${qualified} disable row level security`),
      },
      {
        sql: `alter table ${qualified} force row level security`,
        inverse: undo(`alter table ${qualified} no force row level security`),
      },
    );
    for (const seed of this.policies) statements.push(...this.policySql(qualified, seed));
    return statements;
  }

  /**
   * The policy on the column `name`, with its inverse: equal to the transaction's setting, or an `ltree` column at or
   * below one of the setting's `|`-separated paths; `inherited` adds a select-only policy
   * (`pol_<table>_<column>_inherited`) for the rows on the path above a granted path.
   */
  private policySql(qualified: string, seed: PolicySeed): readonly CompiledStatement[] {
    const policy = quoteIdentifier(constraintName("pol", this.table, [seed.column]));
    const statements: CompiledStatement[] = [
      {
        sql: this.createPolicySql(qualified, policy, seed),
        inverse: [`drop policy if exists ${policy} on ${qualified}`],
      },
    ];
    if (seed.options.match === "platform")
      // The permissive policy shows a tenant the platform's NULL rows, and its USING also picks the rows an UPDATE or a
      // DELETE reaches, so these restrictive policies keep those two commands on the session's own rows: a tenant
      // never changes, deletes or takes over a platform row, and a platform session changes only NULL rows.
      for (const command of ["update", "delete"] as const) {
        const write = quoteIdentifier(
          constraintName("pol", this.table, [seed.column, "write", command]),
        );
        statements.push({
          sql: `create policy ${write} on ${qualified} as restrictive for ${command} using (${this.policyMatch(seed).check})`,
          inverse: [`drop policy if exists ${write} on ${qualified}`],
        });
      }
    if (seed.options.match === "inherited") {
      // Permissive policies OR per command, so a select-only policy widens reads and never writes: update, delete and
      // insert still pass only the policy above. `ltree @> ltree[]` is true when the row's path is an ancestor of, or
      // equal to, one of the granted paths; the tables that take it hold few rows, so the array scan is cheap.
      const inherited = quoteIdentifier(
        constraintName("pol", this.table, [seed.column, "inherited"]),
      );
      statements.push({
        sql: `create policy ${inherited} on ${qualified} for select using (${quoteIdentifier(seed.column)} @> array(select granted::ltree from ${grantedPaths(seed.options.setting)}))`,
        inverse: [`drop policy if exists ${inherited} on ${qualified}`],
      });
    }
    return statements;
  }

  /**
   * `CREATE POLICY` for `seed`, restrictive when it says so (a session with the setting unset is not narrowed).
   *
   * @throws TypeError when a table being created lacks the column, or a path match is on a column that is not `ltree`.
   */
  private createPolicySql(qualified: string, policy: string, seed: PolicySeed): string {
    const { using, check } = this.policyMatch(seed);
    const as = seed.options.restrictive === true ? " as restrictive" : "";
    return `create policy ${policy} on ${qualified}${as} using (${using}) with check (${check})`;
  }

  /**
   * The `USING` and `WITH CHECK` expressions of `seed`.
   *
   * @throws TypeError when a table being created lacks the column, or a path match is on a column that is not `ltree`.
   */
  private policyMatch(seed: PolicySeed): { readonly using: string; readonly check: string } {
    const { column: name, options } = seed;
    const type = this.policyColumnType(name, options);
    const setting = `current_setting(${sqlLiteral(options.setting)}, true)`;
    // A setting set earlier in the session reads as '' once its transaction ends, so '' counts as unset (no rows).
    // `?` over an lquery array (`<path>.*` is the path and every descendant) is GiST-indexable where `<@ any(...)`
    // seq-scans, and a policy cannot OR-expand a list of unknown length; '' or unset gives an empty array (no rows).
    // `equalsOrUnset` also lets a session with the setting unset see the rows whose column is null (a nullable scope
    // column: platform rows); a scoped session still sees only its own. `is not distinct from` is `=` with null = null.
    // `platform` (ADR 0239 amendment, gap C) shows a set session its own rows and the NULL rows, and lets it write only
    // its own: its rows, or the NULL rows for a session with the setting unset.
    // A `uuid` column compares with the UUID a public-id setting encodes (`publicIds: "uuid"`): a plain cast of
    // `scp_…` would raise on every statement.
    const value =
      type === "uuid" ? uuidOf(`nullif(${setting}, '')`) : `nullif(${setting}, '')::${type}`;
    const column = quoteIdentifier(name);
    const same = `${column} is not distinct from ${value}`;
    if (options.match === "platform")
      return { using: `${column} = ${value} or ${column} is null`, check: same };
    const match =
      options.match === "equals"
        ? `${column} = ${value}`
        : options.match === "equalsOrUnset"
          ? same
          : `${column} ? array(select (granted || '.*')::lquery from ${grantedPaths(options.setting)})`;
    if (options.restrictive !== true) return { using: match, check: match };
    // A restrictive policy narrows only a session the setting narrows (ADR 0347 d3): unset, it shows the whole tenant.
    // `exemptNull` lets a row whose column is null (the platform form's platform row) through when its path is at or
    // above a granted path: the root's and the session's product's corpus, never another product's.
    const exempt =
      options.exemptNull === undefined
        ? ""
        : `(${quoteIdentifier(options.exemptNull)} is null and ${column} @> array(select granted::ltree from ${grantedPaths(options.setting)})) or `;
    const narrowed = `nullif(${setting}, '') is null or ${exempt}${match}`;
    return { using: narrowed, check: narrowed };
  }

  /**
   * The SQL type of the policy column `name`: this blueprint's column, else, on an existing table, the column an
   * earlier migration wrote: a public id (`link`, `scopeId`) for an id match, `scope_path` (`ltree`) for a path match.
   *
   * @throws TypeError when a table being created lacks the column, or a path match is on a column that is not `ltree`.
   */
  private policyColumnType(name: string, options: RowLevelSecurityOptions): string {
    const column = this.columns.find((known) => known.name === name);
    if (column === undefined && this.creating)
      throw new TypeError(
        `rowLevelSecurity("${name}") needs the ${name} column in the same ${this.table} blueprint`,
      );
    const type = column?.type ?? (ID_MATCHES.has(options.match) ? this.publicIdColumn : "ltree");
    if (!ID_MATCHES.has(options.match) && type !== "ltree")
      throw new TypeError(
        `${this.table}.${name} is not ltree, so it takes no ${options.match} match`,
      );
    return type;
  }
}
