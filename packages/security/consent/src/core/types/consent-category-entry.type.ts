/**
 * Stackra file contract:
 * Purpose: `ConsentCategoryEntry`, one item of `ConsentConfig.categories`: the category, whether it is required, its
 *          pre-decision default under an opt-out regime, and the hint the banner or the settings switch shows.
 * Boundary: a type only. The label is not here: it is the derived key `consent::enums.consent_category.<code>`. A
 *           required category must be granted by default (the schema refuses otherwise).
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 4); ADR 0294 (decision 8: no anonymous object type in an exported
 *                     signature).
 */
import type { ConsentCategory } from "#core/enums/consent-category.enum";

/** One configured consent category. */
export interface ConsentCategoryEntry {
  /** The consent category this entry configures. */
  readonly category: ConsentCategory;

  /** Always granted, never asked and never stored; its switch is shown locked on. */
  readonly required: boolean;

  /** Granted before a decision under an opt-out regime (`ConsentRegime.Ccpa`); ignored under opt-in. */
  readonly defaultGranted: boolean;

  /** The i18n key of the hint shown with the category, or `null` for none. */
  readonly descriptionKey: string | null;
}
