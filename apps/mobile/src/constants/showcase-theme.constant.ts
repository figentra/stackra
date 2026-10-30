/**
 * Stackra file contract:
 * Purpose: `SHOWCASE_THEME`, the theme this showcase draws: the Stackra layer (steel accent #647282 light, #A7B6C7
 *          dark; Geist Mono display) over the brand-neutral `STACKRA_THEME`. Owner decision 2026-10-28; Figentra
 *          amber is one of the brands on offer.
 * Boundary: data only. `brand-themes/stackra.json` is a copy of the brand repo's `brands/stackra/tokens/theme.json`
 *           (figentra/brand 3d8079a), a `stackra.theme-diff/2` read by `brandTheme` like every brand on offer.
 * Runtime: react-native
 * Governing contract: ADR 0340 (decisions 2, 8 and 11: a brand is a layer above Stackra, never in @stackra/tokens).
 */
import { brandTheme } from "./brand-theme.function";
import STACKRA_THEME_LAYER from "./brand-themes/stackra.json";

// shortcut: a vendored copy of the brand repo's layer; read it from @figentra/brand once the showcase may depend on it.
/** The Stackra layer over the Stackra base: what every page and the Theme Studio start from. */
export const SHOWCASE_THEME = brandTheme(STACKRA_THEME_LAYER);
