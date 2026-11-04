/**
 * Stackra file contract:
 * Purpose: `APP_CSS_TEMPLATE`, the `app/app.css` of a generated Fumadocs site: Tailwind, the Fumadocs neutral theme
 *          and preset, the sources Tailwind scans (the site is gitignored, so they are named), and `theme.css`, the
 *          brand colours gen writes from the DocsConfig.
 * Boundary: a constant.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); STA-2026 (`colors` mapped onto Fumadocs' `--color-fd-*` variables).
 */

/** The emitted `app/app.css`. */
export const APP_CSS_TEMPLATE = `@import "tailwindcss";
@import "fumadocs-ui/css/neutral.css";
@import "fumadocs-ui/css/preset.css";
@import "./theme.css";

@source "./";
@source "../content/";
`;
