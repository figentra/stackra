/**
 * Stackra file contract:
 * Purpose: `EntryFactory<R>`, what the entries callback receives: a value, a principal, money, a list and a section.
 * Boundary: a type only; every key is a path of the record `R`, and a list's columns are paths of its item.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import type { Built } from "#core/types/built.type";
import type { ElementOf } from "#core/types/element-of.type";
import type { EntryBuilder } from "#core/types/entry-builder.type";
import type { EntryNode } from "#core/types/entry-node.type";
import type { Path } from "#core/types/path.type";
import type { PathValue } from "#core/types/path-value.type";
import type { SectionBuilder } from "#core/types/section-builder.type";

/** Builds the entries of an infolist over record type `R`. */
export interface EntryFactory<R> {
  /** A value rendered from the field's type. */
  from: (key: Path<R>) => EntryBuilder;

  /** A principal id rendered as an avatar and a name. */
  principal: (key: Path<R>) => EntryBuilder;

  /** Minor units rendered as money in the currency at `currency`. */
  money: (key: Path<R>, options: { readonly currency: Path<R> }) => EntryBuilder;

  /**
   * A list field as a small table of the item paths `columns`. A `…Minor` column is money in its item's own `currency`,
   * else in the record's currency at `options.currency`.
   */
  list: <K extends Path<R>>(
    key: K,
    columns: readonly Path<ElementOf<NonNullable<PathValue<R, K>>>>[],
    options?: { readonly currency: Path<R> },
  ) => Built<EntryNode>;

  /** A titled group of entries. */
  section: (name: string, entries: readonly Built<EntryNode>[]) => SectionBuilder;
}
