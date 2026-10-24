/**
 * Stackra file contract:
 * Purpose: `I18nMount`, the context component of the `i18n` key: `I18nProvider` with the locale, the catalogues and,
 *          where given, the setter that `Contexts` received. Registered by this package because @stackra/i18n sits
 *          below it and cannot register itself.
 * Boundary: renders the provider only; not exported (the registry holds it).
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 10); ADR 0080.
 */
import { I18nProvider } from "@stackra/i18n/react";
import type { ReactNode } from "react";

import type { ContextProps } from "#react/contexts/context-props.type";

/**
 * The `i18n` context.
 *
 * @example
 * <I18nMount locale={Locale.Ar} messages={messages}>{children}</I18nMount>
 */
export function I18nMount({ locale, messages, setLocale, children }: ContextProps): ReactNode {
  return setLocale === undefined ? (
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  ) : (
    <I18nProvider locale={locale} messages={messages} setLocale={setLocale}>
      {children}
    </I18nProvider>
  );
}
