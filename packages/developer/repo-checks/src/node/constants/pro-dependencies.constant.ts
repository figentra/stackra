/**
 * Stackra file contract:
 * Purpose: `PRO_DEPENDENCIES`, the HeroUI Pro packages: only apps may depend on them.
 * Boundary: data only; `checkMember` reads it.
 * Runtime: node
 * Governing contract: ADR 0310; ADR 0197; ADR 0165 (decision 5); ADR 0461 (decision 3).
 */

/**
 * The HeroUI Pro packages (ADR 0310, ADR 0197): only apps may depend on them; a free or published package never does
 * (ADR 0165 decision 5). Their wrapper, `@stackra-pro/ui`, lives in figentra/stackra-pro (ADR 0461), and no member of
 * figentra/stackra depends on it: `PRO_SCOPE` refuses it.
 */
export const PRO_DEPENDENCIES: readonly string[] = ["@heroui-pro/react", "heroui-native-pro"];
