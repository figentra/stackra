/**
 * Stackra file contract:
 * Purpose: `expectedSchema`, the schema a member's models declare, for `stackra db diff`: one table per model (and per
 *          model addition's side table) in its module's Postgres schema, snake_case plural; one column per data field
 *          (trait fields included, a `Money` as `<name>_minor` and `<name>_currency`, types from `postgresTypeOf`);
 *          one `varchar(33)` column per relation that owns a column (`m:1`, an owning `1:1`, a `Link`) named
 *          `<name>_id`, with an `fk_<table>_<column>` foreign key when its target is a model of the same module; and
 *          one index per `@Index` under its derived `idx_<table>_<columns>` name with `unique` and `where` as declared.
 * Boundary: pure; reads `ir.shapes` and `ir.classes`, through a model's own base models too. Abstract models have no
 *           table. `@Searchable` declares no index here (the migration chooses its GIN and trigram indexes) and the
 *           search columns are not expected; the comparison treats them as implied. A many-to-many pivot table is not
 *           expected either. shortcut: those limits keep `undeclared_*` honest only for what the IR can say; widen
 *           this when the IR records the pivot and search shapes.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 28: a table per model in its module's schema; links have no foreign
 *                     key); ADR 0231 (`idx_` and `fk_` names); ADR 0159; ADR 0336 (side tables); STA-1808.
 */
import { snakeCase } from "@stackra/support";

import { plural } from "#core/functions/plural.function";
import { postgresTypeOf } from "#core/functions/postgres-type-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { RelationIR } from "#core/types/relation-ir.type";
import type { SchemaSnapshot } from "#core/types/schema-snapshot.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** The public id column type. */
const PUBLIC_ID = "varchar(33)";

/** Whether `relation` owns a `<name>_id` column on its own table. */
const ownsColumn = (relation: RelationIR): boolean =>
  relation.kind === "m:1" ||
  relation.kind === "link" ||
  (relation.kind === "1:1" && relation.inverse === undefined);

/** The model's own shape and its base models' shapes, nearest first. */
function shapeChain(ir: MemberIR, shape: ShapeIR): ShapeIR[] {
  const chain: ShapeIR[] = [shape];
  let at: ShapeIR | undefined = shape;
  while (at?.base?.kind === "member" && chain.length < 16) {
    const base: { readonly name: string; readonly module: string } = at.base;
    at = ir.shapes.find((each) => each.name === base.name && each.module === base.module);
    if (at !== undefined) chain.push(at);
  }
  return chain;
}

/** The class and its own base models, nearest first. */
function classChain(ir: MemberIR, declared: DeclaredClass | undefined): DeclaredClass[] {
  const chain: DeclaredClass[] = [];
  let at = declared;
  while (at !== undefined && !chain.includes(at) && chain.length < 16) {
    chain.push(at);
    const base: DeclaredClass["base"] = at.base;
    at =
      base?.own === true
        ? ir.classes.find((each) => each.kind === "model" && each.name === base.name)
        : undefined;
  }
  return chain;
}

/**
 * The schema the models of `ir` declare.
 *
 * @param ir - the member read by discovery.
 * @example
 * expectedSchema(ir).indexes.map((index) => index.name); // ["idx_tax_documents_tenant_id_source_key_channel"]
 */
export function expectedSchema(ir: MemberIR): SchemaSnapshot {
  const columns: SchemaSnapshot["columns"][number][] = [];
  const indexes: SchemaSnapshot["indexes"][number][] = [];
  const foreignKeys: SchemaSnapshot["foreignKeys"][number][] = [];

  for (const shape of ir.shapes) {
    if (shape.kind !== "model" && shape.kind !== "model_addition") continue;
    const declared = ir.classes.find(
      (each) =>
        each.name === shape.name && each.module === shape.module && each.file === shape.file,
    );
    if (declared?.abstract === true) continue;
    const schema = shape.module;
    const table = plural(snakeCase(shape.name));
    const chain = shapeChain(ir, shape);
    const own = new Map<string, SchemaSnapshot["columns"][number]>();
    const put = (name: string, type: string | undefined, nullable: boolean): void => {
      own.set(name, { schema, table, name, ...(type === undefined ? {} : { type }), nullable });
    };
    if (shape.kind === "model_addition") put("id", PUBLIC_ID, false);
    // Base models first, so a field or relation the model redeclares wins.
    const fromBase = chain.map((_, index) => chain[chain.length - 1 - index] as ShapeIR);
    const fields = new Map<string, FieldIR>();
    for (const each of fromBase) for (const field of each.fields) fields.set(field.name, field);
    for (const field of fields.values()) {
      const nullable = field.nullable || field.optional;
      const name = snakeCase(field.name);
      if (field.type.kind === "money") {
        put(`${name}_minor`, "bigint", nullable);
        put(`${name}_currency`, "char(3)", nullable);
      } else put(name, postgresTypeOf(field), nullable);
    }
    const relations = new Map<string, RelationIR>();
    for (const each of fromBase)
      for (const relation of each.entity?.relations ?? []) relations.set(relation.name, relation);
    for (const relation of relations.values()) {
      if (!ownsColumn(relation)) continue;
      const column = `${snakeCase(relation.name)}_id`;
      put(column, PUBLIC_ID, relation.nullable);
      if (relation.kind !== "link" && relation.targetModule === schema)
        foreignKeys.push({
          schema,
          table,
          name: `fk_${table}_${column}`,
          columns: [column],
          referencedSchema: schema,
          referencedTable: plural(snakeCase(relation.target.name)),
        });
    }
    columns.push(...own.values());

    /** The column an `@Index` property names: a relation's `<name>_id`, an embedded path joined by underscores. */
    const columnOf = (path: string): string => {
      const relation = relations.get(path.split(".")[0] ?? "");
      return relation !== undefined && ownsColumn(relation)
        ? `${snakeCase(relation.name)}_id`
        : path.split(".").map(snakeCase).join("_");
    };
    const named = new Set<string>();
    for (const each of classChain(ir, declared))
      for (const facet of each.facets) {
        if (facet.target !== "class" || facet.name !== "Index" || !Array.isArray(facet.options))
          continue;
        const properties = (facet.options as readonly unknown[]).filter(
          (property): property is string => typeof property === "string",
        );
        if (properties.length === 0) continue;
        const flags = (facet.rest?.[0] ?? {}) as {
          readonly unique?: unknown;
          readonly where?: unknown;
        };
        const indexColumns = properties.map(columnOf);
        const name = ["idx", table, ...indexColumns].join("_");
        if (named.has(name)) continue;
        named.add(name);
        indexes.push({
          schema,
          table,
          name,
          columns: indexColumns,
          unique: flags.unique === true,
          predicate: typeof flags.where === "string" ? flags.where : undefined,
        });
      }
  }
  return { columns, indexes, foreignKeys };
}
