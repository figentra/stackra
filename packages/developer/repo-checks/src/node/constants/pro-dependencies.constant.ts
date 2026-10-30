/**
 * Stackra file contract:
 * Purpose: `PRO_DEPENDENCIES`, the HeroUI Pro packages: no member may depend on them.
 * Boundary: data only; `checkMember` reads it.
 * Runtime: node
 * Governing contract: ADR 0469; ADR 0165 (decision 5).
 */

/**
 * The HeroUI Pro packages: Stackra ships free HeroUI and its own components only, so no member of figentra/stackra,
 * apps included, depends on them (ADR 0469).
 */
export const PRO_DEPENDENCIES: readonly string[] = ["@heroui-pro/react", "heroui-native-pro"];
