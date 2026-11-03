/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/panel (the widget slot, the saved view tabs, and the generic
 *          resource pages: List, View, Create and Edit, and the action input modal) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The card and its content, the resource table, fields and values,
 *           and the native action runner are internal.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ActionInputModal } from "#native/resource-pages/action-input-modal";
export type { ActionInputModalProps } from "#native/resource-pages/action-input-modal.props";
export { ResourceFormPage } from "#native/resource-pages/resource-form-page";
export type { ResourceFormPageProps } from "#native/resource-pages/resource-form-page.props";
export { ResourceListPage } from "#native/resource-pages/resource-list-page";
export type { ResourceListPageProps } from "#native/resource-pages/resource-list-page.props";
export { ResourceViewPage } from "#native/resource-pages/resource-view-page";
export type { ResourceViewPageProps } from "#native/resource-pages/resource-view-page.props";
export { SavedViewTabs } from "#native/saved-view-tabs/saved-view-tabs";
export type { SavedViewTabsProps } from "#native/saved-view-tabs/saved-view-tabs.props";
export { WidgetSlot } from "#native/widget-slot/widget-slot";
export type { WidgetSlotProps } from "#native/widget-slot/widget-slot.props";
