/**
 * Stackra file contract:
 * Purpose: `diffSchemas`, compares the schema the models declare with the schema the migrations build, for the given
 *          modules, and returns one `SchemaDifference` per disagreement, sorted by module, table, kind and subject: a
 *          table, column, index or foreign key one side lacks, a column whose nullability or type differs (a type the
 *          map cannot say is `type_unmapped`), and an index of the same name with another shape.
 * Boundary: pure. Only the given modules are compared (a declared package's tables are its own models'). The columns
 *           and indexes the migrations write that no model field declares are implied, never `undeclared_*`: every
 *           `varchar(33)` column but `id` (a link, a foreign key, the tenant column, `parent_id`) carries an automatic
 *           `idx_<table>_<column>` index, and on a table that expects `search_text` (a `@Searchable` model) the search
 *           macro's vectors and `__v<n>` shadows are implied too, so an index over implied columns only is tolerated.
 *           A search column on any other table is undeclared, and so is a trait's column (`tree_path`, `metadata`) on
 *           a table whose model lacks the trait: `expectedSchema` expects a trait's columns only where it is applied.
 *           An expected column `nullable: "either"` agrees with both; an expected `optional` index may be absent; an
 *           expected index with a `method` (a trait's GiST or GIN) must have it. A
 *           predicate compares as Postgres renders it: without parentheses, casts, double quotes, case and spaces,
 *           with `!=`, `in`, `not in`, `like`, `ilike` and `between` folded to `<>`, `= any`, `<> all`, `~~`, `~~*`
 *           and two comparisons. Primary keys and partitions are not compared.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (the migration owns the schema; the model is the declaration); ADR 0231 (`idx_` and
 *                     `fk_` names); ADR 0282 (decision 3: `stackra db diff`); ADR 0221 (search
 *                     columns); STA-1808; STA-2071; STA-1408 (trait columns).
 */
import { normalizePostgresType } from "#core/functions/normalize-postgres-type.function";
import { postgresTypeAgrees } from "#core/functions/postgres-type-agrees.function";
import type { SchemaDifference } from "#core/types/schema-difference.type";
import type { SchemaSnapshot } from "#core/types/schema-snapshot.type";

/** Columns the search macro writes: a vector (per locale), the text and the filters, each with a rebuild shadow. */
const SEARCH_COLUMN = /^(search_vector(_[a-z0-9_]+)?|search_text|search_filters)(__v\d+)?$/;

/** A column of either side. */
type Column = SchemaSnapshot["columns"][number];

/** An index of either side. */
type Index = SchemaSnapshot["indexes"][number];

/** A cast, multi-word, sized and array types included, and never the words after it. */
const CAST =
  /::(character varying|bit varying|double precision|(timestamp|time) with(out)? time zone|[a-z_][a-z0-9_.]*)(\(\d+(,\s*\d+)?\))?(\[\])*/g;

/**
 * A predicate as `pg_get_expr` renders it, so the source compares with Postgres's rewrite.
 * shortcut: folds only what a model's `where` states (FR-007 of STA-2071); a literal Postgres retypes (a date) or an
 * operand of `between` with spaces still reads as `index_shape`, widen this when one bites.
 */
const predicateKey = (predicate: string | undefined): string =>
  (predicate ?? "")
    .toLowerCase()
    .replaceAll('"', "")
    .replaceAll(CAST, "")
    .replaceAll("!=", "<>")
    .replaceAll(/\bnot\s+ilike\b/g, "!~~*")
    .replaceAll(/\bnot\s+like\b/g, "!~~")
    .replaceAll(/\bilike\b/g, "~~*")
    .replaceAll(/\blike\b/g, "~~")
    .replaceAll(/([^\s()]+)\s+between\s+([^\s()]+)\s+and\s+([^\s()]+)/g, "$1 >= $2 and $1 <= $3")
    .replaceAll(/[()\s]/g, "")
    .replaceAll(/=anyarray\[([^\]]*)\]/g, "in$1")
    .replaceAll(/<>allarray\[([^\]]*)\]/g, "notin$1");

/** An index as one comparable and printable string; with `method`, its access method too. */
const shapeOf = (index: Index, method = false): string =>
  `${index.unique ? "unique " : ""}${method ? `using ${index.method ?? "?"} ` : ""}(${index.columns.join(", ")})${
    index.predicate === undefined ? "" : ` where ${index.predicate}`
  }`;

/** Whether `built` is the index `wanted` (the model's side) describes; a method is compared when `wanted` names one. */
const sameIndex = (wanted: Index, built: Index): boolean =>
  wanted.unique === built.unique &&
  wanted.columns.join(",") === built.columns.join(",") &&
  predicateKey(wanted.predicate) === predicateKey(built.predicate) &&
  (wanted.method === undefined || wanted.method === built.method);

/** A column's type and nullability as one printable string. */
const columnText = (column: Column): string =>
  `${column.type === undefined ? "?" : normalizePostgresType(column.type)}${column.nullable === false ? " not null" : ""}`;

/** Rows grouped by `schema.table`. */
function byTable<T extends { readonly schema: string; readonly table: string }>(
  rows: readonly T[],
): Map<string, T[]> {
  const tables = new Map<string, T[]>();
  for (const row of rows) {
    const key = `${row.schema}\u0000${row.table}`;
    tables.set(key, [...(tables.get(key) ?? []), row]);
  }
  return tables;
}

/** The first row of each name. */
const byName = <T extends { readonly name: string }>(
  rows: readonly T[] | undefined,
): Map<string, T> => new Map((rows ?? []).map((row) => [row.name, row]));

/**
 * The differences between `expected` (the models) and `actual` (the migrations) in `modules`.
 *
 * @param expected - the schema `expectedSchema` builds.
 * @param actual - the schema the migrations replay to.
 * @param modules - the module keys (Postgres schemas) to compare.
 * @example
 * diffSchemas(expected, actual, ["billing"]).map((each) => each.kind); // ["missing_column"]
 */
export function diffSchemas(
  expected: SchemaSnapshot,
  actual: SchemaSnapshot,
  modules: readonly string[],
): SchemaDifference[] {
  const inModules = <T extends { readonly schema: string }>(rows: readonly T[]): T[] =>
    rows.filter((row) => modules.includes(row.schema));
  const wanted = byTable(inModules(expected.columns));
  const built = byTable(inModules(actual.columns));
  const wantedIndexes = byTable(inModules(expected.indexes));
  const builtIndexes = byTable(inModules(actual.indexes));
  const wantedKeys = byTable(inModules(expected.foreignKeys));
  const builtKeys = byTable(inModules(actual.foreignKeys));
  const differences: SchemaDifference[] = [];

  for (const key of new Set([...wanted.keys(), ...built.keys()])) {
    const [module = "", table = ""] = key.split("\u0000");
    const add = (
      kind: SchemaDifference["kind"],
      subject: string,
      wantedText: string,
      builtText: string,
    ): void => {
      differences.push({ module, table, kind, subject, expected: wantedText, actual: builtText });
    };
    const modelled = wanted.get(key);
    const migrated = built.get(key);
    if (modelled === undefined) {
      add("undeclared_table", table, "-", "table");
      continue;
    }
    if (migrated === undefined) {
      add("missing_table", table, "table", "-");
      continue;
    }

    const migratedColumns = byName(migrated);
    const modelledColumns = byName(modelled);
    const searchable = modelledColumns.has("search_text");
    const impliedColumn = (name: string): boolean => searchable && SEARCH_COLUMN.test(name);
    for (const column of modelled) {
      const found = migratedColumns.get(column.name);
      if (found === undefined) {
        add("missing_column", column.name, columnText(column), "-");
        continue;
      }
      if (column.nullable !== "either" && found.nullable !== column.nullable)
        add(
          "nullability",
          column.name,
          column.nullable ? "null" : "not null",
          found.nullable ? "null" : "not null",
        );
      if (column.type === undefined)
        add("type_unmapped", column.name, "-", normalizePostgresType(found.type ?? ""));
      else if (!postgresTypeAgrees(column.type, found.type ?? ""))
        add("column_type", column.name, column.type, normalizePostgresType(found.type ?? ""));
    }
    for (const column of migrated)
      if (!modelledColumns.has(column.name) && !impliedColumn(column.name))
        add("undeclared_column", column.name, "-", columnText(column));

    const implied = new Set(
      modelled
        .filter((column) => column.type === "varchar(33)" && column.name !== "id")
        .map((column) => column.name),
    );
    // A link, foreign key, tenant or parent column the migration wrote beyond the model's fields is implied too.
    for (const column of migrated)
      if (
        !modelledColumns.has(column.name) &&
        normalizePostgresType(column.type ?? "") === "varchar(33)"
      )
        implied.add(column.name);
    const modelledIndexes = byName(wantedIndexes.get(key));
    const migratedIndexes = byName(builtIndexes.get(key));
    for (const index of modelledIndexes.values()) {
      const found = migratedIndexes.get(index.name);
      if (found === undefined) {
        if (index.optional !== true)
          add("missing_index", index.name, shapeOf(index, index.method !== undefined), "-");
      } else if (!sameIndex(index, found)) {
        // The access method is printed only when it is what differs.
        const method = index.method !== undefined && index.method !== found.method;
        add("index_shape", index.name, shapeOf(index, method), shapeOf(found, method));
      }
    }
    for (const index of migratedIndexes.values())
      if (
        !modelledIndexes.has(index.name) &&
        !index.columns.every((column) => implied.has(column) || impliedColumn(column))
      )
        add("undeclared_index", index.name, "-", shapeOf(index));

    const modelledKeys = byName(wantedKeys.get(key));
    const migratedKeys = byName(builtKeys.get(key));
    for (const foreignKey of modelledKeys.values())
      if (!migratedKeys.has(foreignKey.name))
        add(
          "missing_foreign_key",
          foreignKey.name,
          `(${foreignKey.columns.join(", ")}) references ${foreignKey.referencedTable}`,
          "-",
        );
    for (const foreignKey of migratedKeys.values())
      if (!modelledKeys.has(foreignKey.name))
        add(
          "undeclared_foreign_key",
          foreignKey.name,
          "-",
          `(${foreignKey.columns.join(", ")}) references ${foreignKey.referencedTable}`,
        );
  }

  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return differences.sort((a, b) =>
    [a.module, a.table, a.kind, a.subject]
      .join("\u0000")
      .localeCompare([b.module, b.table, b.kind, b.subject].join("\u0000")),
  );
}
