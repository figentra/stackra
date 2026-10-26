/**
 * Stackra file contract:
 * Purpose: draws what an icon slot holds on web: a name through `Icon`, an element as given.
 * Boundary: no props of its own beyond the slot; it adds no wrapper element, so the holder's CSS reaches the icon.
 * Runtime: browser
 * Governing contract: ADR 0303 (decisions 7 and 10).
 */
import type { ReactNode } from "react";

import { Icon } from "#react/icon/icon";
import type { SlotIconProps } from "#react/slot-icon/slot-icon.props";

/** Draws an icon slot: an `IconName` becomes an `Icon`, an element is returned unchanged. */
export function SlotIcon({ icon }: SlotIconProps): ReactNode {
  return typeof icon === "string" ? <Icon name={icon} /> : (icon ?? null);
}
