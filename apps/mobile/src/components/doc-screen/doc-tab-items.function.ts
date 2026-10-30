/**
 * Stackra file contract:
 * Purpose: `docTabItems`: the tab pages of the mobile component screen in order, Preview · Usage · API · Docs, with
 *          Hooks after API when the ApiDoc has hooks.
 * Boundary: a pure function; the words come through the translator it is given.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3 (Component screen) and section 4.
 */
import type { I18nKey } from "@stackra/i18n";
import { DocTab } from "@stackra/showcase";

import type { DocPage } from "#src/components/doc-screen/doc-page.type";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/**
 * The tab pages, each with its translated label.
 * @param hasHooks - whether the entry's ApiDoc has hooks
 * @param t - the translator
 * @returns the pages in order
 */
export function docTabItems(
  hasHooks: boolean,
  t: (key: I18nKey) => string,
): readonly { readonly id: DocPage; readonly label: string }[] {
  const labels = SHOWCASE_KEYS.showcase.doc_tab;
  return DocTab.flatMap((id) => [
    { id, label: t(labels[id]) },
    ...(id === "api" && hasHooks ? [{ id: "hooks" as const, label: t(labels.hooks) }] : []),
  ]);
}
