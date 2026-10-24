/**
 * Stackra file contract:
 * Purpose: `I18nContext`, the React context `I18nProvider` fills and every hook of the `./react` entry reads.
 * Boundary: internal; `null` outside a provider, which `useI18nState` turns into an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0080.
 */
import { createContext } from "react";

import type { I18nState } from "./i18n-state.type";

/** The i18n state of the nearest `I18nProvider`, or null. */
export const I18nContext = createContext<I18nState | null>(null);
