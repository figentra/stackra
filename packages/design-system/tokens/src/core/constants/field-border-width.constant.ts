/**
 * Stackra file contract:
 * Purpose: the width of a field's edge, HeroUI's `--field-border-width`, on the web and on native. HeroUI and HeroUI
 *          Native draw fields, checkboxes and radios with no edge (0px), which leaves a white control on the paper page
 *          at about 1.1:1; at 1px the theme's `field-border` (3:1 or more against the page, the surface and the field,
 *          `STACKRA_CONTRAST_PAIRS`) outlines every text field, checkbox and radio in both schemes.
 * Boundary: data only; `themeVariables` and `renderNativeCss` write it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); WCAG 2.2 (1.4.11 non-text contrast).
 */

/** HeroUI's `--field-border-width`, in CSS. */
export const FIELD_BORDER_WIDTH = "1px";
