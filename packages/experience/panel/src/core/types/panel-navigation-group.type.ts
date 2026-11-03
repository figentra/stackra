/**
 * Stackra file contract:
 * Purpose: `PanelNavigationGroup`, one group of a panel's navigation: its label key and its entries in order.
 * Boundary: a type only; `panelNavigationOf` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 12); ADR 0214; build-list item 53 (STA-1981).
 */
import type { I18nKey } from "@stackra/i18n";

import type { PanelNavigationEntry } from "#core/types/panel-navigation-entry.type";

/** A navigation group. */
export interface PanelNavigationGroup {
  /** The group label key. */
  readonly group: I18nKey;

  /** The entries, by order then key. */
  readonly entries: readonly PanelNavigationEntry[];
}
