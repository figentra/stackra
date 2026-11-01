/**
 * Stackra file contract:
 * Purpose: `diffSchemas`, compares the schema the models declare with the schema the migrations build, for the given
 *          modules, and returns one `SchemaDifference` per disagreement, sorted by module, table, kind and subject: a
 *          table, column, index or foreign key one side lacks, a column whose nullability or type differs (a type the
 *          map cannot say is `type_unmapped`), and an index of the same name with another shape.
 * Boundary: pure. Only the given modules are compared (a declared package's tables are its own models'). The columns
 *           and indexes the migrations write that no model field declares are implied, never `undeclared_*`: every
 *           `varchar(33)` column but `id` (a link, a foreign key, the tenant column, `parent_id`) carries an automatic
 *           `idx_<table>_<column>` index, and `search_*`, `tree_path` and `metadata` come from macros and traits, so
 *           an index over implied columns only is tolerated and a `search_*` column is not undeclared. A predicate
 *           compares without parentheses, casts, case and spaces (shortcut: a predicate Postgres rewrites beyond
 *           that is reported as `index_shape`; widen the normaliser then). Primary keys and partitions are not
 *           compared.
 * Runtime: isomorphic
 * Governing contract: ADR 0159 (the migration owns the schema; the model is the declaration); ADR 0231 (`idx_` and
 *                     `fk_` names); ADR 0282 (decision 3: `stackra db diff`); STA-1808.
 */
import { normalizePostgresType } from "#core/functions/normalize-postgres-type.function";
import { postgresTypeAgrees } from "#core/functions/postgres-type-agrees.function";
import type { SchemaDifference } from "#core/types/schema-difference.type";
import type { SchemaSnapshot } from "#core/types/schema-snapshot.type";

/** Columns macros and traits write that no model field names. */
const IMPLIED_COLUMN = /^(search_vector.*|search_text.*|search_filters.*|tree_path|metadata)$/;

/** A column of either side. */
type Column = SchemaSnapshot["columns"][number];

/** An index of either side. */
type Index = SchemaSnapshot["indexes"][number];

/** A predicate without parentheses, casts, case and spaces, so Postgres's rendering compares with the source. */
const predicateKey = (predicate: string | undefined): string =>
  (predicate ?? "")
    .toLowerCase()
    .replaceAll(/::[a-z_]+( [a-z_]+)*/g, "")
    .replaceAll(/[()\s]/g, "");

/** An index as one comparable and printable string. */
const shapeOf = (index: Index): string =>
  `${index.unique ? "unique " : ""}(${index.columns.join(", ")})${
    index.predicate === undefined ? "" : ` where ${index.predicate}`
  }`;

/** Whether two indexes with one name are the same index. */
const sameIndex = (a: Index, b: Index): boolean =>
  a.unique === b.unique &&
  a.columns.join(",") === b.columns.join(",") &&
  predicateKey(a.predicate) === predicateKey(b.predicate);

/** A column's type and nullability as one printable string. */
const columnText = (column: Column): string =>
  `${column.type === undefined ? "?" : normalizePostgresType(column.type)}${column.nullable ? "" : " not null"}`;

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
    for (const column of modelled) {
      const found = migratedColumns.get(column.name);
      if (found === undefined) {
        add("missing_column", column.name, columnText(column), "-");
        continue;
      }
      if (found.nullable !== column.nullable)
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
      if (!modelledColumns.has(column.name) && !IMPLIED_COLUMN.test(column.name))
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
      if (found === undefined) add("missing_index", index.name, shapeOf(index), "-");
      else if (!sameIndex(index, found))
        add("index_shape", index.name, shapeOf(index), shapeOf(found));
    }
    for (const index of migratedIndexes.values())
      if (
        !modelledIndexes.has(index.name) &&
        !index.columns.every((column) => implied.has(column) || IMPLIED_COLUMN.test(column))
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
