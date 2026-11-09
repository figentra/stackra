/**
 * Stackra file contract:
 * Purpose: `PlacedAction`, one button `useResourceActions` gives a resource page: a `@stackra/ui` `ResourceAction` with
 *          the button look a menu does not draw (variant, size, end icon, full width, shortcut id, loading), for a page
 *          that draws it as an `ActionButton`.
 * Boundary: a type only; internal to the resource pages. A menu (a row, the bulk bar, a page header) reads it as a
 *           plain `ResourceAction`.
 * Runtime: browser
 * Governing contract: ADR 0307 (rule 3); the SDUI catalogue case `actionButton` (STA-1981).
 */
import type { ResourceAction } from "@stackra/ui/contracts";

import type { ActionButtonSpec } from "#core/types/action-button-spec.type";

/** One button with its button look. */
export type PlacedAction = ResourceAction &
  Pick<
    ActionButtonSpec,
    "variant" | "size" | "endIcon" | "isFullWidth" | "shortcutId" | "isLoading"
  >;
