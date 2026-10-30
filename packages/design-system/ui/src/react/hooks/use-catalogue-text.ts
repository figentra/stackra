/**
 * Stackra file contract:
 * Purpose: `useCatalogueText(english)`, the translator a design-system component formats its own words with: the
 *          nearest `I18nProvider`'s `t`, or the package's English catalogue when no provider is above the component or
 *          the provider's catalogues hold no message for the key.
 * Boundary: the shared React layer of the `./react` and `./native` entries (native composes react, ADR 0004 §1),
 *           so it may import `@stackra/i18n/react`; exported from both entries for any package
 *           that ships its own English catalogue (each passes its own). The English answer
 *           keeps an app or a test that has not mounted i18n working, never a raw key; a key missing from English too
 *           throws `RangeError`, as `formatMessage` does. Whether a provider is above is fixed for a tree position, so
 *           the hooks called stay the same from render to render.
 * Runtime: isomorphic
 * Governing contract: ADR 0004 §1 (layer direction); ADR 0080; ADR 0268 (R15: ICU, typed keys); ADR 0403 (catalogues in seven languages).
 */
import { formatMessage } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import type { CatalogueText } from "#core/types/catalogue-text.type";

/** The merged catalogues `formatMessage` reads. */
type Messages = Parameters<typeof formatMessage>[0];

/**
 * The active translator, falling back to `english`.
 *
 * @example
 * const t = useCatalogueText(UI_ENGLISH);
 * t(UI_KEYS.ui.navigation_header.back); // "Back", or the active locale's word
 */
export function useCatalogueText(english: Messages): CatalogueText {
  let provided: CatalogueText | undefined;
  try {
    // shortcut: @stackra/i18n/react exposes no optional translation hook, so the no-provider throw is caught; the
    // call runs on every render either way. Drop this disable when i18n ships one.
    // oxlint-disable-next-line react-hooks/rules-of-hooks, react/hooks -- reason: unconditional call; try only catches the no-provider throw
    provided = useTranslation().t;
  } catch {
    // No I18nProvider above this component: the English catalogue answers.
    provided = undefined;
  }
  return (key, values) => {
    if (provided !== undefined)
      try {
        return provided(key, values);
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
      }
    return formatMessage(english, key, values, "en");
  };
}
