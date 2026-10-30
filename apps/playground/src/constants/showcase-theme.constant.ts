/**
 * Stackra file contract:
 * Purpose: `SHOWCASE_THEME`, the theme this showcase draws by default: the Stackra layer (steel accent #647282 light,
 *          #A7B6C7 dark; Geist Mono display) over the brand-neutral `STACKRA_THEME` (owner decision 2026-10-28). The
 *          Theme Studio can switch the page to another approved brand (`BRAND_THEMES`), Figentra amber among them.
 * Boundary: data only; the layer is `brand-themes/stackra.json` (figentra/brand 3d8079a), built by `buildBrandTheme`
 *           like every brand.
 * Runtime: browser
 * Governing contract: ADR 0340 (decisions 2, 8 and 11: a brand is a layer above Stackra, never in @stackra/tokens).
 */
import STACKRA from "#src/constants/brand-themes/stackra.json";
import { buildBrandTheme } from "#src/constants/brand-themes/build-brand-theme.function";

/** The Stackra layer (steel accent) over the Stackra base: what every page and the Theme Studio start from. */
export const SHOWCASE_THEME = buildBrandTheme(STACKRA);
