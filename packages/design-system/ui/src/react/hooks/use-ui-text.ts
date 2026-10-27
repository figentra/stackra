/**
 * Stackra file contract:
 * Purpose: `useUiText()`, the translator of this package's own words (`ui::*`): the active locale's message, or the
 *          English catalogue's when no `I18nProvider` is mounted or it holds no `ui` namespace.
 * Boundary: internal, in the shared React layer; the web and native components import it by path. A label the caller passes always wins; this
 *           only answers the defaults.
 * Runtime: isomorphic
 * Governing contract: ADR 0004 §1; ADR 0080; ADR 0403.
 */
import { UI_ENGLISH } from "#core/constants/ui-english.constant";
import { useCatalogueText } from "#react/hooks/use-catalogue-text";
import type { CatalogueText } from "#core/types/catalogue-text.type";

/**
 * The ui translator.
 *
 * @example
 * const t = useUiText();
 * <IconButton label={backLabel ?? t(UI_KEYS.ui.navigation_header.back)} />
 */
export function useUiText(): CatalogueText {
  return useCatalogueText(UI_ENGLISH);
}
