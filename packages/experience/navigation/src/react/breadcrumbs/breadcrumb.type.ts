/**
 * Stackra file contract:
 * Purpose: `Breadcrumb`, one crumb of the trail: where it links and its label key.
 * Boundary: a type only; the label is a typed i18n key the trail's renderer translates.
 * Runtime: browser
 * Governing contract: ADR 0164; ADR 0080 (typed i18n keys); ADR 0303 (decision 1: router-aware UI is navigation's).
 */
import type { I18nKey } from "@stackra/i18n";

/** One crumb of the breadcrumb trail. */
export interface Breadcrumb {
  /** The href the crumb links to. */
  readonly to: string;

  /** The label key (a route title, a resource label). */
  readonly label: I18nKey;
}
