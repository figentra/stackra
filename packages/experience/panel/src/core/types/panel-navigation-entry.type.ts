/**
 * Stackra file contract:
 * Purpose: `PanelNavigationEntry`, one entry of a panel's navigation read from a resource's or a document's
 *          `navigation`: its key, label key, path, icon, order, the permission it needs and, for a badge, the list read
 *          whose count it shows.
 * Boundary: a type only; `panelNavigationOf` builds it, `usePanelNavigation` draws it. The badge's input is the list
 *           query's input for the named view with one row asked for, so the answer's `count` is the view's count.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 12: a navigation badge names a view); ADR 0214 (gate-filtered navigation);
 *                     build-list item 53 (STA-1981).
 */
import type { AnyClass } from "@stackra/container";
import type { I18nKey } from "@stackra/i18n";
import type { IconName } from "@stackra/icons/contracts";

/** One navigation entry. */
export interface PanelNavigationEntry {
  /** The resource key (`orders.order`) or document key (`orders.sales_overview`). */
  readonly key: string;

  /** The label key: the resource's or the document's title. */
  readonly label: I18nKey;

  /** The path it leads to: the List page or the document. */
  readonly href: string;

  /** The icon beside it. */
  readonly icon: IconName;

  /** Its position in the group, ascending; entries without one follow, by key. */
  readonly order?: number;

  /** The permission it needs: the resource's read permission, or the document's. */
  readonly permission?: string;

  /** The read whose count is the badge. */
  readonly badge?: {
    /** The list query. */
    readonly query: AnyClass;
    /** Its input for the badge's view. */
    readonly input: Readonly<Record<string, unknown>>;
  };
}
