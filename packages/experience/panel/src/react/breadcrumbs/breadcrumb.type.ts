/**
 * Stackra file contract:
 * Purpose: `Breadcrumb`, one crumb of the trail: where it links and its label key.
 * Boundary: a type only; the label is a typed i18n key the shell's breadcrumbs translate.
 * Runtime: isomorphic
 * Governing contract: ADR 0164; ADR 0080 (typed i18n keys).
 */
import type { I18nKey } from "@stackra/i18n";

/** One crumb. */
export interface Breadcrumb {
  /** The href the crumb links to. */
  readonly to: string;

  /** The label key (a route title, a resource label). */
  readonly label: I18nKey;
}
