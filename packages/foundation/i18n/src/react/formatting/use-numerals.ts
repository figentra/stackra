/**
 * Stackra file contract:
 * Purpose: `useNumerals()`, the digits the nearest `I18nProvider` writes (the customer's setting where allowed, else
 *          `I18nConfig.numerals`), for a component that formats outside the provider's hooks: a design-system
 *          component handed a plain locale, a chart's axis, a React Aria locale.
 * Boundary: never throws: outside a provider it is `user`, the engine's own digits, so a component that may render
 *           without i18n mounted keeps working and forces nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28: the digits are a per-customer setting).
 */
import { use } from "react";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { I18nContext } from "#react/i18n-provider/i18n-context";

/**
 * The active digits.
 *
 * @example
 * const numerals = useNumerals();
 * formatNumber(total, locale, undefined, numerals);
 */
export function useNumerals(): NumberingSystem {
  return use(I18nContext)?.numerals ?? NumberingSystem.User;
}
