/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/panel (the widget slot and the saved view tabs) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The card and its content are internal.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { SavedViewTabs } from "#native/saved-view-tabs/saved-view-tabs";
export type { SavedViewTabsProps } from "#native/saved-view-tabs/saved-view-tabs.props";
export { WidgetSlot } from "#native/widget-slot/widget-slot";
export type { WidgetSlotProps } from "#native/widget-slot/widget-slot.props";
