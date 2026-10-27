/**
 * Stackra file contract:
 * Purpose: `BrandGlyphName`, the name of one brand icon.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0305 (rule 10); the stackra brand kit.
 */
import type { BRAND_GLYPHS } from "./brand-glyphs.constant";

/** The name of one brand icon. */
export type BrandGlyphName = keyof typeof BRAND_GLYPHS;
