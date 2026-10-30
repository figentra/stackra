/**
 * Stackra file contract:
 * Purpose: `applyBrandTheme`: draws the whole showcase in `brand`: rewrites `<style id="showcase-theme">` (made by
 *          main.tsx) with its CSS and keeps the pick in this browser, so the next load opens on it.
 * Boundary: the document's theme style and localStorage (guarded) only; the transition is the caller's.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 2).
 */
import type { BrandTheme } from "#src/constants/brand-themes";

import { brandThemeCss } from "./brand-theme-css.function";
import { ACTIVE_BRAND_KEY } from "./active-brand-key.constant";

/** Applies `brand` to the document and remembers it. */
export function applyBrandTheme(brand: BrandTheme): void {
  try {
    localStorage.setItem(ACTIVE_BRAND_KEY, brand.id);
  } catch {
    // shortcut: a browser that refuses storage keeps the brand for this page only.
  }
  let style = document.getElementById("showcase-theme");
  if (!style) {
    style = document.createElement("style");
    style.id = "showcase-theme";
    document.head.append(style);
  }
  style.textContent = brandThemeCss(brand);
}
