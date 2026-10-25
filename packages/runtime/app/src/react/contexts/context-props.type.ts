/**
 * Stackra file contract:
 * Purpose: `ContextProps`, what `Contexts` hands every registered context component: the active locale, its merged
 *          catalogues, the locale setter where the locale is a stored choice, and the tree inside.
 * Boundary: a type only. A context component reads its configuration from the container (`useConfig`), never from
 *           these props.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 10); ADR 0080; ADR 0294 (decision 23: a Provider is a React context
 *                     component only).
 */
import type { Locale } from "@stackra/i18n";
import type { I18nProviderProps } from "@stackra/i18n/react";
import type { ReactNode } from "react";

/** The props of a context component. */
export interface ContextProps {
  /** The active locale. */
  readonly locale: Locale;

  /** The locale's catalogues, merged along its fallback chain. */
  readonly messages: I18nProviderProps["messages"];

  /** Loads and switches to another locale; absent where the URL selects the locale (the web). */
  readonly setLocale?: (locale: Locale) => Promise<void>;

  /** The tree inside this context. */
  readonly children?: ReactNode;
}
