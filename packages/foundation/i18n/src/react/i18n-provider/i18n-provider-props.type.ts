/**
 * Stackra file contract:
 * Purpose: `I18nProviderProps`, what the generated `Contexts` of `@stackra/app` hands `I18nProvider`: the active
 *          locale, its merged catalogues and, on a member whose locale is a stored choice, the setter.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0080, ADR 0295 (decision 7: createApp mounts the contexts), ADR 0297 (decision 4).
 */
import type { ReactNode } from "react";

import type { Locale } from "#core/enums/locale.enum";
import type { Messages } from "#core/types/messages.type";

/** The props of `I18nProvider`. */
export interface I18nProviderProps {
  /** The active locale: the request's locale mount on the web, the stored or device locale on native. */
  readonly locale: Locale;

  /** The locale's catalogues, merged along its fallback chain (gen's `loadMessages`). */
  readonly messages: Messages;

  /**
   * Loads the new locale's catalogues, stores the choice and re-renders with them. Omitted where the URL alone selects
   * the locale (the web), so `useLocale().setLocale` rejects there and the switcher navigates instead.
   */
  readonly setLocale?: (locale: Locale) => Promise<void>;

  /** The tree that may translate and format. */
  readonly children?: ReactNode;
}
