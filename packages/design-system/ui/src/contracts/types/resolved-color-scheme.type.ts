/**
 * Stackra file contract:
 * Purpose: `ResolvedColorScheme`: a colour scheme once `system` is resolved.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0060 (light and
 *          dark).
 */
import type { ColorScheme } from "#contracts/enums/color-scheme.enum";

/** A colour scheme once `system` is resolved: what is on screen. */
export type ResolvedColorScheme = Exclude<ColorScheme, "system">;
