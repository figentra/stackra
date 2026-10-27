/**
 * Stackra file contract:
 * Purpose: `STACKRA_BACKGROUND`, the `stackra` theme's background as hex per scheme: the default theme colour and
 *          splash background of `ThemingOptions`.
 * Boundary: data only, internal to this package. Typed, not derived, because gen reads a shape default only as a
 *           constant (ADR 0294 decision 26); the theming-options test pins it to `STACKRA_THEME.colors.background`, so
 *           it cannot drift from the tokens' derived hex.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0302 (decision 2).
 */

// shortcut: a typed copy of STACKRA_THEME's derived background hex; read it from tokens once gen evaluates calls.
/** The `stackra` background: paper in the light scheme, ink in the dark. */
export const STACKRA_BACKGROUND = Object.freeze({ light: "#F5F6F3", dark: "#0B0D0F" });
