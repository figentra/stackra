/**
 * Stackra file contract:
 * Purpose: `useUiProText()`, the native translator of this package's own words (`ui_pro::*`): the active locale's
 *          message, or the English catalogue's when no `I18nProvider` is mounted or it holds no `ui_pro` namespace.
 * Boundary: internal; the native components import it by path. The twin of `#react/hooks/use-ui-pro-text`, reading
 *           `useCatalogueText` from `@stackra/ui/native` so a native bundle never loads the web entry.
 * Runtime: react-native
 * Governing contract: ADR 0004 §1 (a React hook lives in a React layer, not core); ADR 0080; ADR 0403.
 */
import type { CatalogueText } from "@stackra/ui";
import { useCatalogueText } from "@stackra/ui/native";

import { UI_PRO_ENGLISH } from "#core/constants/ui-pro-english.constant";

/** The ui-pro translator on native: `t(UI_PRO_KEYS.ui_pro.scheduler.move_later)`. */
export function useUiProText(): CatalogueText {
  return useCatalogueText(UI_PRO_ENGLISH);
}
