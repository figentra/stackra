/**
 * Stackra file contract:
 * Purpose: `FontFamilyName`, part of the token schema of the Stackra Design System (see `Theme`): the name of one
 *          font stack.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { FontFamilies } from "#contracts/types/font-families.type";

/** The name of one font stack. */
export type FontFamilyName = keyof FontFamilies;
