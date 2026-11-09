/**
 * Stackra file contract:
 * Purpose: `FAMILY_BLUEPRINT`, each material family's value for every blueprint role. `front` draws the marketing
 *          blueprint: decorative hairline rules mixed from the theme's accent, pipes in the accent itself, `+` marks,
 *          frames on the kit's `lg` radius plus 4 px (10 px for Stackra, owner Q2). `studio` keeps the same roles quiet for product screens:
 *          rules on the separator, no marks, frames on the container radius.
 * Boundary: values are theme roles, radii and lengths only, never a colour value, so every theme draws them in its own
 *           colours.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (section 9 as amended 2026-11-03, the blueprint direction, owner 2026-11-03); STA-2041.
 */
import type { BlueprintRole } from "#contracts/enums/blueprint-role.enum";
import type { MaterialFamily } from "#contracts/enums/material-family.enum";

/** Each family's blueprint values. */
export const FAMILY_BLUEPRINT: Readonly<
  Record<MaterialFamily, Readonly<Record<BlueprintRole, string>>>
> = Object.freeze({
  front: {
    rule: "color-mix(in oklab, var(--accent) 18%, transparent)",
    "rule-width": "1px",
    "mark-size": "9px",
    "frame-radius": "calc(var(--radius-lg) + 4px)",
    // The pipe carries meaning (one thing turning into many), so it keeps the accent's 3:1 as a graphic (WCAG 1.4.11).
    pipe: "var(--accent)",
    "pipe-width": "1.5px",
    "junction-size": "7px",
    "dock-height": "40px",
  },
  studio: {
    rule: "var(--separator)",
    "rule-width": "1px",
    "mark-size": "0px",
    "frame-radius": "var(--radius-container)",
    pipe: "var(--border)",
    "pipe-width": "1px",
    "junction-size": "5px",
    "dock-height": "36px",
  },
});
