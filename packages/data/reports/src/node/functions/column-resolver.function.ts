/**
 * Stackra file contract:
 * Purpose: `columnResolver(meta, join)`, the path resolver of one report statement: `status` is `row."status"`, the
 *          embedded `total.minor` is `row."total_minor"`, and `customer.country` left-joins the to-one relation
 *          `customer` once (alias `j0`) and is `j0."country"`.
 * Boundary: internal; reads the generated metadata only, so a path that is not a single-column field is an error and
 *           never reaches SQL as written. Only to-one relations are followed: a to-many relation would repeat the
 *           source's rows and inflate every measure. Each column name is checked as a snake_case identifier before it
 *           is quoted (the same rule `@stackra/database` applies, whose resolver is internal to it).
 * Runtime: node
 * Governing contract: ADR 0160 (no raw field name in SQL); ADR 0470 (decision 2: a dimension may follow a relation).
 */
import type { SourceMeta } from "#node/types/source-meta.type";
import type { SourceProperty } from "#node/types/source-property.type";

/** A Postgres identifier the generated metadata may name. */
const IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;

/** The to-one relation kinds a path may follow. */
const TO_ONE = new Set(["m:1", "1:1"]);

/**
 * A resolver of source paths to quoted, aliased columns.
 *
 * @param meta - the source model's metadata.
 * @param join - adds `left join <alias>.<relation> as <joined>` to the statement.
 * @throws TypeError (from the resolver) for a path that names no single-column field or crosses a to-many relation.
 * @example
 * const column = columnResolver(meta, (field, alias) => qb.leftJoin(field, alias));
 * column("customer.country"); // 'j0."country"'
 */
export function columnResolver(
  meta: SourceMeta,
  join: (field: string, alias: string) => void,
): (path: string) => string {
  const joins = new Map<string, string>();
  return (path) => {
    const segments = path.split(".");
    let alias = "row";
    let current = meta;
    let followed = "";
    let at = 0;
    for (; at < segments.length - 1; at += 1) {
      const name = segments[at] ?? "";
      const property = current.properties[name];
      if (property?.targetMeta === undefined || property.embeddedProps !== undefined) break;
      if (!TO_ONE.has(property.kind ?? ""))
        throw new TypeError(
          `${meta.className}.${path} crosses the to-many relation "${name}", which would repeat rows`,
        );
      followed = followed === "" ? name : `${followed}.${name}`;
      let joined = joins.get(followed);
      if (joined === undefined) {
        joined = `j${joins.size}`;
        join(`${alias}.${name}`, joined);
        joins.set(followed, joined);
      }
      alias = joined;
      current = property.targetMeta;
    }
    const [head = "", ...rest] = segments.slice(at);
    let property: SourceProperty | undefined = current.properties[head];
    for (const part of rest) property = property?.embeddedProps?.[part];
    const [column, ...more] = property?.fieldNames ?? [];
    if (column === undefined || more.length > 0 || !IDENTIFIER.test(column))
      throw new TypeError(`${meta.className}.${path} is not a single-column field`);
    return `${alias}."${column}"`;
  };
}
