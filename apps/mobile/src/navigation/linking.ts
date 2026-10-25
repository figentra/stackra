/**
 * Stackra file contract:
 * Purpose: the deep-link map from URLs to screens.
 * Boundary: the linking config only; it does not register navigators or screens.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import type { LinkingOptions, PathConfig } from "@react-navigation/native";
import * as Linking from "expo-linking";

import type { HomeStackParamList, RootStackParamList } from "./types";

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
        ProProgressButton: "design-system/pro/progress-button",
        ProSlideButton: "design-system/pro/slide-button",
        ProSwipeableRow: "design-system/pro/swipeable-row",
        ProCalendar: "design-system/pro/calendar",
        ProDatePicker: "design-system/pro/date-picker",
        ProNumberField: "design-system/pro/number-field",
        ProAgenda: "design-system/pro/agenda",
        ProAreaChart: "design-system/pro/area-chart",
        ProAutocomplete: "design-system/pro/autocomplete",
        ProBadge: "design-system/pro/badge",
        ProBarChart: "design-system/pro/bar-chart",
        ProCarousel: "design-system/pro/carousel",
        ProChartCrosshair: "design-system/pro/chart-crosshair",
        ProChartIndicator: "design-system/pro/chart-indicator",
        ProChartTooltip: "design-system/pro/chart-tooltip",
        ProComboBox: "design-system/pro/combo-box",
        ProComposedChart: "design-system/pro/composed-chart",
        ProDateField: "design-system/pro/date-field",
        ProDateRangePicker: "design-system/pro/date-range-picker",
        ProDateTimePicker: "design-system/pro/date-time-picker",
        ProEmptyState: "design-system/pro/empty-state",
        ProFlipCard: "design-system/pro/flip-card",
        ProFloatingActionButton: "design-system/pro/floating-action-button",
        ProLineChart: "design-system/pro/line-chart",
        ProMorphButton: "design-system/pro/morph-button",
        ProMorphTabs: "design-system/pro/morph-tabs",
        ProNumberPad: "design-system/pro/number-pad",
        ProNumberStepper: "design-system/pro/number-stepper",
        ProNumberValue: "design-system/pro/number-value",
        ProPhoneNumberField: "design-system/pro/phone-number-field",
        ProPieChart: "design-system/pro/pie-chart",
        ProProgressBar: "design-system/pro/progress-bar",
        ProProgressCircle: "design-system/pro/progress-circle",
        ProRadarChart: "design-system/pro/radar-chart",
        ProRadialChart: "design-system/pro/radial-chart",
        ProRadioButtonGroup: "design-system/pro/radio-button-group",
        ProRangeCalendar: "design-system/pro/range-calendar",
        ProRating: "design-system/pro/rating",
        ProSegment: "design-system/pro/segment",
        ProSocialAuthButton: "design-system/pro/social-auth-button",
        ProSplitView: "design-system/pro/split-view",
        ProStackedMeter: "design-system/pro/stacked-meter",
        ProStepper: "design-system/pro/stepper",
        ProSwipeableTabs: "design-system/pro/swipeable-tabs",
        ProTable: "design-system/pro/table",
        ProTimeline: "design-system/pro/timeline",
        ProTimePicker: "design-system/pro/time-picker",
        ProToggleButton: "design-system/pro/toggle-button",
        ProToggleButtonGroup: "design-system/pro/toggle-button-group",
        ProTrendChip: "design-system/pro/trend-chip",
        ProWheelDateTimePicker: "design-system/pro/wheel-date-time-picker",
        ProWheelPicker: "design-system/pro/wheel-picker",
        ProWheelPickerGroup: "design-system/pro/wheel-picker-group",
        ProWheelTimePicker: "design-system/pro/wheel-time-picker",
        ProWidget: "design-system/pro/widget",
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
    },
  },
};
