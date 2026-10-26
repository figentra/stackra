/**
 * Stackra file contract:
 * Purpose: draws what an icon slot holds on native: a name through `Icon`, an element as given.
 * Boundary: no props of its own beyond the slot; it adds no wrapper view, so the holder's provider reaches the icon.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decisions 7 and 10).
 */
import type { ReactNode } from "react";

import { Icon } from "#native/icon/icon";
import type { SlotIconProps } from "#native/slot-icon/slot-icon.props";

/** Draws an icon slot: an `IconName` becomes an `Icon`, an element is returned unchanged. */
export function SlotIcon({ icon }: SlotIconProps): ReactNode {
  return typeof icon === "string" ? <Icon name={icon} /> : (icon ?? null);
}
