/**
 * Stackra file contract:
 * Purpose: `useI18nState()`, the one read of `I18nContext` the public hooks share.
 * Boundary: internal; throws outside an `I18nProvider`, so a missing provider is never a silent English default.
 * Runtime: isomorphic
 * Governing contract: ADR 0080.
 */
import { use } from "react";

import { I18nContext } from "./i18n-context";
import type { I18nState } from "./i18n-state.type";

/**
 * The state of the nearest `I18nProvider`.
 *
 * @throws Error outside an `I18nProvider`.
 */
export function useI18nState(): I18nState {
  const state = use(I18nContext);
  if (state === null) throw new Error("@stackra/i18n hooks need an I18nProvider above them");
  return state;
}
