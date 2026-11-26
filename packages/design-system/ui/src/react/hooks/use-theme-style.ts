/**
 * Stackra file contract:
 * Purpose: `useThemeStyle(theme)`, the inline variables that draw one element's subtree in another theme (a product's
 *          brand) in the page's current scheme, or undefined for none.
 * Boundary: the variables only, the same set the playground's brand frames use; the element that wears them is the
 *           caller's. A nested DesignSystemProvider cannot do this: it writes the theme onto `<html>`, so the whole
 *           page would change, not the subtree.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0340 (decision 2); STA-2041.
 */
import { themeVariables } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";
import { type CSSProperties, use, useMemo } from "react";

import { DesignSystemContext } from "#react/design-system-provider/design-system-context";

/** The variables that draw a subtree in `theme`, in the page's resolved scheme. */
export function useThemeStyle(theme: Theme | undefined): CSSProperties | undefined {
  const scheme = use(DesignSystemContext)?.resolvedColorScheme ?? "light";
  return useMemo(() => {
    if (!theme) return undefined;
    const { heroui, stackra } = themeVariables(theme);
    return {
      ...heroui.root,
      ...stackra.root,
      ...heroui[scheme],
      ...stackra[scheme],
    } as CSSProperties;
  }, [theme, scheme]);
}
