/**
 * Stackra file contract:
 * Purpose: `UI_ENGLISH`, this package's English catalogue (`assets/lang/en/ui.json`) as the `ui` namespace, the
 *          messages `useUiText` formats from when no `I18nProvider` is above a component or the provider's catalogues
 *          hold no `ui` namespace.
 * Boundary: internal; read from the shipped catalogue file itself, so the English words live once, in the catalogue.
 * Runtime: isomorphic
 * Governing contract: ADR 0080; ADR 0403 (seven languages, English the source catalogue).
 */
import english from "../../../assets/lang/en/ui.json";

/** The English `ui` catalogue, keyed by its namespace. */
export const UI_ENGLISH = Object.freeze({ ui: english });
