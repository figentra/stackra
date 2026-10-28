/**
 * Stackra file contract:
 * Purpose: `SourceProperty`, one property of a source model's generated ORM metadata as the report runner reads it:
 *          its kind, columns, embedded properties and relation target.
 * Boundary: a structural type only, so this package reads ORM metadata without importing the ORM (ADR 0097).
 * Runtime: node
 * Governing contract: ADR 0097 (decision 2); ADR 0160.
 */
import type { SourceMeta } from "#node/types/source-meta.type";

/** One property of a model's metadata. */
export interface SourceProperty {
  /** The ORM reference kind: `scalar`, `embedded`, `m:1`, `1:1`, `1:m`, `m:n`. */
  readonly kind?: string;

  /** The columns the property is stored in. */
  readonly fieldNames?: readonly string[];

  /** The properties of an embedded value (`total.minor`). */
  readonly embeddedProps?: Readonly<Record<string, SourceProperty>>;

  /** The target model of a relation. */
  readonly targetMeta?: SourceMeta;
}
