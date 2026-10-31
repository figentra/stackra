/**
 * Stackra file contract:
 * Purpose: `THEME_PX`, the Stackra theme's sizes, type steps, edges and layers as numbers (`nativeTokens`), for the
 *          places a class cannot reach: React Native styles, Skia paragraph styles and SVG presentation attributes.
 * Boundary: data only, computed once from `STACKRA_THEME` (ADR 0501 native keys). A theme applied at runtime reaches
 *           classes and CSS variables; these numbers follow the stock theme.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2).
 */
import { nativeTokens, STACKRA_THEME } from "@stackra/tokens";

// shortcut: the stock theme's numbers; read the applied theme's (`applyNativeTheme`'s result) once a provider holds it.
/** The Stackra theme's numeric values. */
export const THEME_PX = nativeTokens(STACKRA_THEME);
