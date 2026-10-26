/**
 * Stackra file contract:
 * Purpose: `UI_PRO_ENGLISH`, this package's English catalogue (`assets/lang/en/ui_pro.json`) as the `ui_pro`
 *          namespace, the messages `useUiProText` formats from when no `I18nProvider` is above a component or the
 *          provider's catalogues hold no `ui_pro` namespace.
 * Boundary: internal; read from the shipped catalogue file, so the English words live once, in the catalogue.
 * Runtime: isomorphic
 * Governing contract: ADR 0080; ADR 0403 (seven languages, English the source catalogue).
 */
import english from "../../../assets/lang/en/ui_pro.json";

/** The English `ui_pro` catalogue, keyed by its namespace. */
export const UI_PRO_ENGLISH = Object.freeze({ ui_pro: english });
