/**
 * Stackra file contract:
 * Purpose: `columnOf`, the column of a model path in the ORM metadata: `paidAt` is `paid_at`, the embedded
 *          `total.minor` is `total_minor`.
 * Boundary: internal; reads the generated metadata only, so a path that is not a scalar or embedded field is an error
 *           and never reaches SQL as written.
 * Runtime: node
 * Governing contract: ADR 0160 (no raw field name in SQL); ADR 0307 (rule 2).
 */
import type { EntityMetadata, EntityProperty } from "@mikro-orm/core";

/**
 * The column of `path` on the model `meta` describes.
 *
 * @throws TypeError when `path` names no single-column field.
 * @example
 * columnOf(em.getMetadata(Order), "total.minor"); // "total_minor"
 */
export function columnOf(meta: EntityMetadata, path: string): string {
  const [head = "", ...rest] = path.split(".");
  let property: EntityProperty | undefined = meta.properties[head];
  for (const part of rest) property = property?.embeddedProps?.[part];
  const [column, ...more] = property?.fieldNames ?? [];
  if (column === undefined || more.length > 0)
    throw new TypeError(`${meta.className}.${path} is not a single-column field`);
  return column;
}
