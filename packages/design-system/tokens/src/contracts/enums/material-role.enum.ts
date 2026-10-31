/**
 * Stackra file contract:
 * Purpose: the material roles: the parts of an interface that draw a material. A component asks for its role
 *          (`popover`) and the family decides the level (`glass`, `thick` or `solid`), so one switch moves the page
 *          and no component names a level or writes a backdrop filter. Each renders as `.material-role-<role>`.
 * Boundary: the names only; the family role maps live in core (`MATERIAL_FAMILY_ROLES`).
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (decision 1 as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */

/** The material roles. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const MaterialRole = Object.freeze([
  "nav-bar",
  "tab-bar",
  "sidebar",
  "toolbar",
  "sheet",
  "modal",
  "popover",
  "menu",
  "tooltip",
  "toast",
  "command",
  "card",
  "action-bar",
  "fab",
  "segmented-track",
  "search-in-bar",
  "media-controls",
] as const);

/** One material role. */
export type MaterialRole = (typeof MaterialRole)[number];
