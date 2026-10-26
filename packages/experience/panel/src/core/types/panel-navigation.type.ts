/**
 * Stackra file contract:
 * Purpose: `PanelNavigation`, where a resource or a document sits in its panel's navigation: the group, the icon, the order
 *          and the view whose count is the badge.
 * Boundary: a type only. The label is derived; the group is a typed i18n key and the icon an `IconName`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 12: a navigation badge names a view); ADR 0214 (gate-filtered navigation); ADR 0309.
 */
import type { I18nKey } from "@stackra/i18n";
import type { IconName } from "@stackra/icons/contracts";

/** A navigation entry. */
export interface PanelNavigation {
  /** The group label key. */
  readonly group: I18nKey;

  /** The icon beside the entry. */
  readonly icon: IconName;

  /** The position in the group, ascending. */
  readonly order?: number;

  /** The view whose estimated count is the badge. */
  readonly badge?: string;
}
