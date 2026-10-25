/**
 * Stackra file contract:
 * Purpose: `useLocaleChoice()`, the visitor's remembered locale: `chosen` (or `null`) and `choose(locale)`, which the
 *          locale switcher and the locale suggestion banner write, so the banner never offers a locale again after an
 *          answer.
 * Boundary: the record is the browser cookie named by `I18nConfig.cookieName`, written here and never read by the
 *           server to redirect or vary a response (ADR 0297 decision 4). The server and the first client paint see
 *           `null`, so the shared HTML never depends on it. A cookie value that is not a shipped locale reads as
 *           `null`. Where there is no cookie jar (native), the choice lives for the session only.
 * Runtime: browser
 * Governing contract: ADR 0297 (decision 4), ADR 0080, ADR 0305 (class components: hooks as fields).
 */
import { useMemo, useSyncExternalStore } from "react";

import type { Locale } from "#core/enums/locale.enum";
import { useI18nState } from "#react/i18n-provider/use-i18n-state";
import type { LocaleChoice } from "./locale-choice.type";

/** One year, in seconds: how long the browser keeps the choice. */
const COOKIE_MAX_AGE = 31_536_000;

/** Re-renders every reader after a choice. */
const listeners = new Set<() => void>();

/** The choice where there is no `document` (native): kept for the session only. */
let remembered: string | null = null;

/** Registers a reader for `useSyncExternalStore`. */
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The raw value of cookie `name`, or null. */
function readChoice(name: string): string | null {
  if (typeof document === "undefined") return remembered;
  for (const part of document.cookie.split(";")) {
    const at = part.indexOf("=");
    if (at === -1 || part.slice(0, at).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(at + 1).trim());
    } catch {
      return null; // a malformed value is no choice
    }
  }
  return null;
}

/** Records `locale` under cookie `name` and wakes every reader. */
function writeChoice(name: string, locale: Locale): void {
  if (typeof document === "undefined") remembered = locale;
  else {
    const secure = globalThis.location?.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(locale)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }
  for (const listener of listeners) listener();
}

/** Always null on the server and while hydrating. */
const serverChoice = (): null => null;

/**
 * The visitor's remembered locale choice.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * const choice = useLocaleChoice();
 * const suggested = preferred !== current && choice.chosen === null ? preferred : null;
 * choice.choose(next);
 */
export function useLocaleChoice(): LocaleChoice {
  const { config } = useI18nState();
  const { cookieName, locales } = config;
  const raw = useSyncExternalStore(subscribe, () => readChoice(cookieName), serverChoice);
  const chosen = locales.find((locale) => locale === raw) ?? null;
  return useMemo<LocaleChoice>(
    () => ({ chosen, choose: (locale) => writeChoice(cookieName, locale) }),
    [chosen, cookieName],
  );
}
