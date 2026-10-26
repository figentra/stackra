/**
 * Stackra file contract:
 * Purpose: `PRO_DEPENDENCIES`, HeroUI Pro and its wrapper package: only apps and the private `@stackra-pro/ui` may depend on
 *          them, and only apps on `@stackra-pro/ui`.
 * Boundary: data only; `checkMember` reads it.
 * Runtime: node
 * Governing contract: ADR 0310; ADR 0197; ADR 0165 (decision 5).
 */

/**
 * HeroUI Pro and its wrapper package (ADR 0310, ADR 0197): only apps and the private `@stackra-pro/ui` may depend on
 * them, and only apps on `@stackra-pro/ui`; a free or published package never does (ADR 0165 decision 5).
 */
export const PRO_DEPENDENCIES: readonly string[] = [
  "@heroui-pro/react",
  "heroui-native-pro",
  "@stackra-pro/ui",
];
