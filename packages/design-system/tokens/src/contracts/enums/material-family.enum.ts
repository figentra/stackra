/**
 * Stackra file contract:
 * Purpose: the theme families, which decide where glass goes: `front` (storefront, marketing, the consumer mobile
 *          app: the functional layer is glass, content sits on an ambient field or media) and `studio` (console,
 *          panel, admin: content is solid, glass only on overlays and floating chrome).
 * Boundary: the names only; each family's role map is `MATERIAL_FAMILY_ROLES` in core.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (decision 1 as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */

/** The theme families. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const MaterialFamily = Object.freeze(["front", "studio"] as const);

/** One theme family. */
export type MaterialFamily = (typeof MaterialFamily)[number];
