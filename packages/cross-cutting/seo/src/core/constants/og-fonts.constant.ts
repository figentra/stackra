/**
 * Stackra file contract:
 * Purpose: `OG_FONTS`, the faces an Open Graph card is set in: Inter for Latin text and Noto Sans Arabic for Arabic,
 *          regular and bold, as WOFF files (the layout engine reads TTF, OTF and WOFF, not WOFF2).
 * Boundary: internal; `loadOgFonts` fetches each URL once per isolate. Both families are SIL OFL 1.1, served from the
 *           fontsource packages at an exact version on jsDelivr, so the bytes never change under a cached card.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 7); ADR 0302 (the type stacks: sans and arabic).
 */

/** Where the fontsource files live. */
const CDN = "https://cdn.jsdelivr.net/npm";

// shortcut: fixed faces fetched from a CDN; upgrade to the theme's own font files once @stackra/tokens ships them.
/** The card's font faces. */
export const OG_FONTS = Object.freeze([
  {
    name: "Inter",
    weight: 400,
    url: `${CDN}/@fontsource/inter@5.0.0/files/inter-latin-400-normal.woff`,
  },
  {
    name: "Inter",
    weight: 700,
    url: `${CDN}/@fontsource/inter@5.0.0/files/inter-latin-700-normal.woff`,
  },
  {
    name: "Noto Sans Arabic",
    weight: 400,
    url: `${CDN}/@fontsource/noto-sans-arabic@5.0.0/files/noto-sans-arabic-arabic-400-normal.woff`,
  },
  {
    name: "Noto Sans Arabic",
    weight: 700,
    url: `${CDN}/@fontsource/noto-sans-arabic@5.0.0/files/noto-sans-arabic-arabic-700-normal.woff`,
  },
] as const);
