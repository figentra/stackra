/**
 * Stackra file contract:
 * Purpose: `ALL_SOURCES`, a test fixture: every kit source path the outputs read.
 * Boundary: test support only; never imported by package code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */

/** Every source path the outputs read. */
export const ALL_SOURCES = [
  "README.md",
  "versions.json",
  "tokens/theme.json",
  "logos/app-icon/app-icon-light.svg",
  "logos/app-icon/adaptive-foreground.svg",
  "logos/favicon/favicon.svg",
  "logos/splash/splash-light.svg",
] as const;
