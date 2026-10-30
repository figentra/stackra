/**
 * Stackra file contract:
 * Purpose: `readActiveBrand`: the brand this browser picked in the Theme Studio, Figentra when none is.
 * Boundary: reads localStorage, guarded: a browser that refuses storage gets Figentra.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 2).
 */
import { type BrandTheme, BRAND_THEMES } from "#src/constants/brand-themes";

import { ACTIVE_BRAND_KEY } from "./active-brand-key.constant";

/** The picked brand, or the first (Stackra) when none is stored or the stored one is gone. */
export function readActiveBrand(): BrandTheme {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(ACTIVE_BRAND_KEY);
  } catch {
    // shortcut: a browser that refuses storage always opens on Stackra.
  }
  return BRAND_THEMES.find(({ id }) => id === stored) ?? (BRAND_THEMES[0] as BrandTheme);
}
