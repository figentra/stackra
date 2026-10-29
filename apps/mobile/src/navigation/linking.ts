/**
 * Stackra file contract:
 * Purpose: the deep-link map from URLs to screens, including `stackra://expo-sharing`, where expo-sharing's share
 *          extension opens the app, to the share inbox.
 * Boundary: the linking config only; it does not register navigators or screens.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import type { LinkingOptions, PathConfig } from "@react-navigation/native";
import * as Linking from "expo-linking";

import type { HomeStackParamList } from "./types";
import type { RootStackParamList } from "./root-stack-param-list.type";

/**
 * The Home tab's paths. Typed against its own param list: React Navigation's nested-config inference does not
 * reach a third level (root stack, tabs, stack), so written inline its `initialRouteName` is typed as `undefined`.
 */
const HOME_TAB_LINKS: PathConfig<HomeStackParamList> = {
  // In development builds the design-system landing is the Home tab's root, and a deep link into one of its pages
  // keeps the landing underneath, so back works. Release builds have only the Home screen.
  initialRouteName: __DEV__ ? "DesignSystem" : "Home",
  // The review area's links exist only where its screens do: development builds.
  screens: __DEV__
    ? {
        DesignSystem: "design-system",
        FreeAccordion: "design-system/free/accordion",
        FreeActionMenu: "design-system/free/action-menu",
        FreeAlert: "design-system/free/alert",
        FreeAlertDialog: "design-system/free/alert-dialog",
        FreeAvatar: "design-system/free/avatar",
        FreeBadge: "design-system/free/badge",
        FreeBreadcrumbs: "design-system/free/breadcrumbs",
        FreeBulkActionBar: "design-system/free/bulk-action-bar",
        FreeButton: "design-system/free/button",
        FreeCard: "design-system/free/card",
        FreeCheckbox: "design-system/free/checkbox",
        FreeCheckboxGroup: "design-system/free/checkbox-group",
        FreeChip: "design-system/free/chip",
        FreeCloseButton: "design-system/free/close-button",
        FreeComboBox: "design-system/free/combo-box",
        FreeDataTable: "design-system/free/data-table",
        FreeDateField: "design-system/free/date-field",
        FreeDatePicker: "design-system/free/date-picker",
        FreeDrawer: "design-system/free/drawer",
        FreeEmptyState: "design-system/free/empty-state",
        FreeEntityPicker: "design-system/free/entity-picker",
        FreeErrorState: "design-system/free/error-state",
        FreeFilterBar: "design-system/free/filter-bar",
        FreeForm: "design-system/free/form",
        FreeFormField: "design-system/free/form-field",
        FreeFormSection: "design-system/free/form-section",
        FreeIcon: "design-system/free/icon",
        FreeIconButton: "design-system/free/icon-button",
        FreeInputGroup: "design-system/free/input-group",
        FreeLink: "design-system/free/link",
        FreeList: "design-system/free/list",
        FreeMenu: "design-system/free/menu",
        FreeModal: "design-system/free/modal",
        FreeNavigationList: "design-system/free/navigation-list",
        FreeNumberField: "design-system/free/number-field",
        FreePageHeader: "design-system/free/page-header",
        FreePageSkeleton: "design-system/free/page-skeleton",
        FreePopover: "design-system/free/popover",
        FreeProgressBar: "design-system/free/progress-bar",
        FreeProgressCircle: "design-system/free/progress-circle",
        FreePropertyList: "design-system/free/property-list",
        FreeRadioGroup: "design-system/free/radio-group",
        FreeReveal: "design-system/free/reveal",
        FreeSearchField: "design-system/free/search-field",
        FreeSection: "design-system/free/section",
        FreeSelect: "design-system/free/select",
        FreeSeparator: "design-system/free/separator",
        FreeSkeleton: "design-system/free/skeleton",
        FreeSpinner: "design-system/free/spinner",
        FreeStatusBadge: "design-system/free/status-badge",
        FreeSurface: "design-system/free/surface",
        FreeSwitch: "design-system/free/switch",
        FreeTable: "design-system/free/table",
        FreeTabs: "design-system/free/tabs",
        FreeTagGroup: "design-system/free/tag-group",
        FreeTextArea: "design-system/free/text-area",
        FreeTextField: "design-system/free/text-field",
        FreeToast: "design-system/free/toast",
        FreeTooltip: "design-system/free/tooltip",
        FreeTypography: "design-system/free/typography",
        FreeUseConfirmation: "design-system/free/use-confirmation",
        FreeAiMark: "design-system/free/ai-mark",
        FreeEnvironmentBanner: "design-system/free/environment-banner",
        FreeModeSwitch: "design-system/free/mode-switch",
      }
    : { Home: "" },
};

/** URL ↔ screen map (code-based routing has no file paths to infer it from). */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Tabs: {
        screens: {
          HomeTab: HOME_TAB_LINKS,
          SettingsTab: { screens: { Settings: "settings" } },
          // Development builds only, like the tab itself.
          ...(__DEV__ ? { SearchTab: { screens: { Search: "search" } } } : {}),
        },
      },
      Item: "items/:id",
      // expo-sharing's iOS share extension opens `<scheme>://expo-sharing` after a share.
      ShareInbox: "expo-sharing",
    },
  },
};
