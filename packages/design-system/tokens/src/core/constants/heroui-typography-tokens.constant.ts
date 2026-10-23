/**
 * Stackra file contract:
 * Purpose: which theme type token each HeroUI Typography `type` is drawn in, so the renderers can restyle HeroUI's
 *          own classes (`.typography--h1` on the web, `.text__root--type-h1` on native) in the theme's type scale.
 * Boundary: data only; a row applies to a theme only when the theme defines its token, and the Arabic twin
 *          (`<token>-ar`) only when the theme defines that too.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 2); ADR 0303 (decision 9); ADR 0165 (HeroUI v3 on web, HeroUI Native).
 */

/**
 * HeroUI v3 and HeroUI Native name their text types alike. Each row is HeroUI's `type` value, which its class names
 * carry (`typography--body-sm`), and the theme token that styles it: `h1` to `h6` and `body` map to the same-named
 * tokens, `body-sm` and `body-xs` to the theme's `small` and `caption`.
 */
export const HEROUI_TYPOGRAPHY_TOKENS = Object.freeze([
  { type: "h1", token: "h1" },
  { type: "h2", token: "h2" },
  { type: "h3", token: "h3" },
  { type: "h4", token: "h4" },
  { type: "h5", token: "h5" },
  { type: "h6", token: "h6" },
  { type: "body", token: "body" },
  { type: "body-sm", token: "small" },
  { type: "body-xs", token: "caption" },
] as const);
