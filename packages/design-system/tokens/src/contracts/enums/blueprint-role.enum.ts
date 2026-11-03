/**
 * Stackra file contract:
 * Purpose: the blueprint roles: the drawing language of a marketing page in the `front` family (the rules between
 *          sections, the `+` marks at their corners, the frame radius, the pipes that join schematic windows and their
 *          junction boxes, the section dock). Each renders as `--blueprint-<role>`, set per material family, so a
 *          product's landing draws the blueprint in its own colours and product screens (`studio`) stay quiet.
 * Boundary: the names only; the family values live in core (`FAMILY_BLUEPRINT`).
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (section 9 as amended 2026-11-03: the blueprint roles); STA-2041.
 */

/** The blueprint roles. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the roles are CSS names, never shown.
export const BlueprintRole = Object.freeze([
  "rule",
  "rule-width",
  "mark-size",
  "frame-radius",
  "pipe",
  "pipe-width",
  "junction-size",
  "dock-height",
] as const);

/** One blueprint role. */
export type BlueprintRole = (typeof BlueprintRole)[number];
