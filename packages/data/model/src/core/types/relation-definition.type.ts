/**
 * Stackra file contract:
 * Purpose: `RelationDefinition`, one relation field as a relation decorator recorded it and its `members` reader
 *          gives it back: the target thunk, the inverse side, and the options of that decorator.
 * Boundary: a type only; the definition is frozen. The target stays a thunk (ADR 0294 R11), so two models of one
 *           module may point at each other; the reader calls it, never the decorator.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 11 and 28).
 */
import type { AnyClass } from "@stackra/container";

import type { OnDelete } from "#core/enums/on-delete.enum";

/** One recorded relation. */
export interface RelationDefinition {
  /** The target model, as a thunk. */
  readonly target: () => AnyClass;

  /** The inverse side's property on the target (`(line) => line.order`), for a one-to-many. */
  readonly inverse?: (item: never) => unknown;

  /** The foreign key's delete rule, for a many-to-one. */
  readonly onDelete?: OnDelete;

  /** Whether a removed child is deleted, for a one-to-many. */
  readonly orphanRemoval?: boolean;

  /** The pivot table, for a many-to-many. */
  readonly pivotTable?: string;
}
