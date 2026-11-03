/**
 * Stackra file contract:
 * Purpose: `resourceActionLook(spec)`, the menu fields of an `ActionButtonSpec` look as `@stackra/ui`'s `ResourceAction`
 *          takes them: the start icon as the item's icon, the description, the shortcut, the tone, the disabled state
 *          and its reason, and the link.
 * Boundary: internal; pure. A field left out of the spec is left out of the result, so a derived action keeps its own.
 *           The caller adds `id`, `label` and `onPress`. Web and native renderers share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3); ADR 0504; the SDUI catalogue cases `actionButton`, `rowActions` and
 *                     `bulkActions` (STA-1981).
 */
import type { ResourceAction } from "@stackra/ui/contracts";

import type { ActionButtonSpec } from "#core/types/action-button-spec.type";

/** The fields of a resource action a spec can set. */
type Look = Pick<
  ResourceAction,
  "icon" | "description" | "shortcut" | "tone" | "isDisabled" | "disabledReason" | "href"
>;

/**
 * The menu look of `spec`.
 *
 * @example
 * resourceActionLook({ startIcon: "trash", tone: "danger" }); // { icon: "trash", tone: "danger" }
 */
export function resourceActionLook(spec: Omit<ActionButtonSpec, "action" | "place">): Look {
  const look: { -readonly [K in keyof Look]: Look[K] } = {};
  if (spec.startIcon !== undefined) look.icon = spec.startIcon;
  if (spec.description !== undefined) look.description = spec.description;
  if (spec.shortcut !== undefined) look.shortcut = spec.shortcut;
  if (spec.tone !== undefined) look.tone = spec.tone;
  if (spec.isDisabled !== undefined) look.isDisabled = spec.isDisabled;
  if (spec.disabledReason !== undefined) look.disabledReason = spec.disabledReason;
  if (spec.href !== undefined) look.href = spec.href;
  return look;
}
