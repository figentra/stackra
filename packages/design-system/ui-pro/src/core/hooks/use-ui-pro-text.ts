/**
 * Stackra file contract:
 * Purpose: `useUiProText()`, the translator of this package's own words (`ui_pro::*`): the active locale's message,
 *          or the English catalogue's when no `I18nProvider` is mounted or it holds no `ui_pro` namespace.
 * Boundary: internal; the web and native components import it by path. A label the caller passes always wins; this
 *           only answers the defaults. The provider-or-English logic is `@stackra/ui`'s `useCatalogueText`.
 * Runtime: isomorphic
 * Governing contract: ADR 0080; ADR 0403.
 */
import { useCatalogueText, type CatalogueText } from "@stackra/ui";

import { UI_PRO_ENGLISH } from "#core/constants/ui-pro-english.constant";

/**
 * The ui-pro translator.
 *
 * @example
 * const t = useUiProText();
 * <HeroCodeBlock.CopyButton aria-label={label ?? t(UI_PRO_KEYS.ui_pro.code_block.copy)} />
 */
export function useUiProText(): CatalogueText {
  return useCatalogueText(UI_PRO_ENGLISH);
}
