/**
 * Stackra file contract:
 * Purpose: `DropdownTriggerProps`: props of `Dropdown.Trigger`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); STA-1371 (dropdown page, owner approval 2026-10-29).
 */
import type { ComponentProps } from "react";
import type { Dropdown as HeroDropdown } from "@heroui/react";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";

/** Props of `Dropdown.Trigger`: HeroUI's trigger props and an optional button look. */
export type DropdownTriggerProps = ComponentProps<typeof HeroDropdown.Trigger> & {
  /**
   * Draws the trigger as a Button of this variant. Left out, the trigger has no look of its own, for a trigger that
   * is a row or a card drawn by its children and `className`.
   */
  readonly variant?: ButtonVariant | undefined;
};
