/**
 * Stackra file contract:
 * Purpose: `Entry`, the data constructors of an infolist entry, as a generated View page writes them
 *          (`Entry.list("variants", { columns: ["id", "sku"] })`).
 * Boundary: pure: each returns a frozen `EntryNode`; the infolist builder records through them. A section is `Section.of`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import type { Enum } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";

import type { EntryNode } from "#core/types/entry-node.type";

/** The flags a value entry takes. */
interface EntryOptions {
  readonly copyable?: boolean;
  readonly enum?: Enum.Any;
  readonly labels?: Readonly<Record<string, I18nKey>>;
}

/**
 * Builds the entry nodes of a View page.
 *
 * @example
 * Entry.from("id", { copyable: true });
 * Entry.money("totals.totalMinor", { currency: "totals.currency" });
 */
export const Entry = Object.freeze({
  /** A value rendered from the field's type. */
  from: (key: string, options: EntryOptions = {}): EntryNode =>
    Object.freeze({ kind: "value", key, ...options }),

  /** A principal id as an avatar and a name. */
  principal: (key: string, options: EntryOptions = {}): EntryNode =>
    Object.freeze({ kind: "principal", key, ...options }),

  /** Minor units as money in the currency at `currency`. */
  money: (
    key: string,
    options: { readonly currency: string; readonly copyable?: boolean },
  ): EntryNode => Object.freeze({ kind: "money", key, ...options }),

  /** A list field as a small table of the item paths `columns`. */
  list: (key: string, options: { readonly columns: readonly string[] }): EntryNode =>
    Object.freeze({ kind: "list", key, columns: Object.freeze([...options.columns]) }),
});
