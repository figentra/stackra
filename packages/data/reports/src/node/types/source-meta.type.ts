/**
 * Stackra file contract:
 * Purpose: `SourceMeta`, the part of a source model's generated ORM metadata the report runner reads to resolve a
 *          path: each property's kind, columns, embedded properties and relation target, and the primary key.
 * Boundary: a structural type only, so this package reads the metadata `Database.em().getMetadata(model)` returns
 *           without importing the ORM (ADR 0097: only `@stackra/database` does).
 * Runtime: node
 * Governing contract: ADR 0097 (decision 2); ADR 0160 (no raw field name in SQL).
 */
import type { SourceProperty } from "#node/types/source-property.type";

/** A model's metadata, as far as reports read it. */
export interface SourceMeta {
  /** The model class name, named in an error. */
  readonly className: string;

  /** The properties by name. */
  readonly properties: Readonly<Record<string, SourceProperty | undefined>>;

  /** The primary key property names. */
  readonly primaryKeys: readonly string[];
}
