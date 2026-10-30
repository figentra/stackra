/**
 * Stackra file contract:
 * Purpose: `ThemeColorSync`, which keeps the browser's theme-color in step with the scheme on screen, not only the
 *          system's (index.html sets it before paint). It draws nothing; the shell mounts it in every layout, the
 *          full-screen routes included.
 * Boundary: the `<meta name="theme-color">` tags only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0060 (light, dark).
 */
import { useDesignSystem } from "@stackra/ui/react";
import { useLayoutEffect } from "react";

import { SHOWCASE_THEME } from "#src/constants/showcase-theme.constant";

/** Mirrors the resolved scheme's background into the browser chrome. */
export function ThemeColorSync() {
  const { resolvedColorScheme } = useDesignSystem();
  const background = SHOWCASE_THEME.colors.background;
  const themeColor = resolvedColorScheme === "dark" ? background.hexDark : background.hexLight;
  useLayoutEffect(() => {
    for (const meta of document.querySelectorAll('meta[name="theme-color"]'))
      meta.setAttribute("content", themeColor);
  }, [themeColor]);
  return null;
}
