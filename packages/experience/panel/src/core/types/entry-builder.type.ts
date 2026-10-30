/**
 * Stackra file contract:
 * Purpose: `EntryBuilder`, one infolist entry under construction: whether it is copyable, its enum labels.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import type { I18nKey } from "@stackra/i18n";

import type { Built } from "#core/types/built.type";
import type { EntryNode } from "#core/types/entry-node.type";

/** The chainable builder of one View page entry. */
export interface EntryBuilder extends Built<EntryNode> {
  /** Adds a copy button to the value. */
  copyable: () => this;

  /** Names the label key of each enum code (`.labels(I18n.orders.enums.order_status)`) where the derived key misses. */
  labels: (labels: Readonly<Record<string, I18nKey>>) => this;
}
