/**
 * Stackra file contract:
 * Purpose: `ColumnBuilder`, one column under construction: copyable, sortable, hidden, its enum labels.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 2: a sortable key needs an index).
 */
import type { I18nKey } from "@stackra/i18n";

import type { Built } from "#core/types/built.type";
import type { ColumnNode } from "#core/types/column-node.type";

/** The chainable builder of one table column. */
export interface ColumnBuilder extends Built<ColumnNode> {
  /** Adds a copy button to the cell. */
  copyable: () => this;

  /** Makes the column sortable; the key needs an index. */
  sortable: () => this;

  /** Starts the column hidden in the column picker. */
  hidden: () => this;

  /** Names the label key of each enum code (`.labels(I18n.orders.enums.order_status)`) where the derived key misses. */
  labels: (labels: Readonly<Record<string, I18nKey>>) => this;
}
