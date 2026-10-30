/**
 * Stackra file contract:
 * Purpose: `ColumnNode`, one recorded table column: how the value renders, its row path and its flags.
 * Boundary: a type only; built by `Column.*` and by the table builder.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1, 2 and 13: keys are row paths; no custom column renderers in v3.1).
 */
import type { Enum } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";

/** One table column. */
export interface ColumnNode {
  /** As typed, as a principal (avatar and name), as money with its currency, or as the length of a list. */
  readonly kind: "value" | "principal" | "money" | "count";

  /** The row path (`totals.totalMinor`). */
  readonly key: string;

  /** Whether the cell has a copy button. */
  readonly copyable?: boolean;

  /** Whether the column sorts; the key needs an index (`sort_not_indexed`). */
  readonly sortable?: boolean;

  /** Whether the column starts hidden in the column picker. */
  readonly hidden?: boolean;

  /** For money: the row path of the currency code, or a bind (`record.totals.currency`). */
  readonly currency?: string;

  /** The enum whose labels and tones render the value; gen fills it from the row type. */
  readonly enum?: Enum.Any;
  /** The label key of each enum code, from the generated keys (`I18n.orders.enums.order_status`). */
  readonly labels?: Readonly<Record<string, I18nKey>>;
}
