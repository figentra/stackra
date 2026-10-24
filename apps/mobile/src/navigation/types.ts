/**
 * Stackra file contract:
 * Purpose: the route names and their params, for every navigator in the app.
 * Boundary: types only, plus the global `ReactNavigation` augmentation; it declares no navigator.
 * Runtime: isomorphic
 * Governing contract: ADR 0007 (documentation).
 */
import type { NavigatorScreenParams } from "@react-navigation/native";

/**
 * The routes of the Home tab's stack and their params, declared once. A screen's `route.params` and every
 * `navigate()` are typed from here.
 */
export type HomeStackParamList = {
  /** The Home screen; takes no params. */
  Home: undefined;
  /** The design-system landing, the Home tab's root in development builds; deep link `stackra://design-system`. */
  DesignSystem: undefined;
  /** The free Accordion page; deep link `stackra://design-system/free/accordion`. */
  FreeAccordion: undefined;
  /** The free ActionMenu page; deep link `stackra://design-system/free/action-menu`. */
  FreeActionMenu: undefined;
  /** The free Alert page; deep link `stackra://design-system/free/alert`. */
  FreeAlert: undefined;
  /** The free AlertDialog page; deep link `stackra://design-system/free/alert-dialog`. */
  FreeAlertDialog: undefined;
  /** The free Avatar page; deep link `stackra://design-system/free/avatar`. */
  FreeAvatar: undefined;
  /** The free Badge page; deep link `stackra://design-system/free/badge`. */
  FreeBadge: undefined;
  /** The free Breadcrumbs page; deep link `stackra://design-system/free/breadcrumbs`. */
  FreeBreadcrumbs: undefined;
  /** The free BulkActionBar page; deep link `stackra://design-system/free/bulk-action-bar`. */
  FreeBulkActionBar: undefined;
  /** The free Button page; deep link `stackra://design-system/free/button`. */
  FreeButton: undefined;
  /** The free Card page; deep link `stackra://design-system/free/card`. */
  FreeCard: undefined;
  /** The free Checkbox page; deep link `stackra://design-system/free/checkbox`. */
  FreeCheckbox: undefined;
  /** The free CheckboxGroup page; deep link `stackra://design-system/free/checkbox-group`. */
  FreeCheckboxGroup: undefined;
  /** The free Chip page; deep link `stackra://design-system/free/chip`. */
  FreeChip: undefined;
  /** The free CloseButton page; deep link `stackra://design-system/free/close-button`. */
  FreeCloseButton: undefined;
  /** The free ComboBox page; deep link `stackra://design-system/free/combo-box`. */
  FreeComboBox: undefined;
  /** The free DataTable page; deep link `stackra://design-system/free/data-table`. */
  FreeDataTable: undefined;
  /** The free DateField page; deep link `stackra://design-system/free/date-field`. */
  FreeDateField: undefined;
  /** The free DatePicker page; deep link `stackra://design-system/free/date-picker`. */
  FreeDatePicker: undefined;
  /** The free Drawer page; deep link `stackra://design-system/free/drawer`. */
  FreeDrawer: undefined;
  /** The free EmptyState page; deep link `stackra://design-system/free/empty-state`. */
  FreeEmptyState: undefined;
  /** The free EntityPicker page; deep link `stackra://design-system/free/entity-picker`. */
  FreeEntityPicker: undefined;
  /** The free ErrorState page; deep link `stackra://design-system/free/error-state`. */
  FreeErrorState: undefined;
  /** The free FilterBar page; deep link `stackra://design-system/free/filter-bar`. */
  FreeFilterBar: undefined;
  /** The free Form page; deep link `stackra://design-system/free/form`. */
  FreeForm: undefined;
  /** The free FormField page; deep link `stackra://design-system/free/form-field`. */
  FreeFormField: undefined;
  /** The free FormSection page; deep link `stackra://design-system/free/form-section`. */
  FreeFormSection: undefined;
  /** The free Icon page; deep link `stackra://design-system/free/icon`. */
  FreeIcon: undefined;
  /** The free IconButton page; deep link `stackra://design-system/free/icon-button`. */
  FreeIconButton: undefined;
  /** The free InputGroup page; deep link `stackra://design-system/free/input-group`. */
  FreeInputGroup: undefined;
  /** The free Link page; deep link `stackra://design-system/free/link`. */
  FreeLink: undefined;
  /** The free List page; deep link `stackra://design-system/free/list`. */
  FreeList: undefined;
  /** The free Menu page; deep link `stackra://design-system/free/menu`. */
  FreeMenu: undefined;
  /** The free Modal page; deep link `stackra://design-system/free/modal`. */
  FreeModal: undefined;
  /** The free NavigationList page; deep link `stackra://design-system/free/navigation-list`. */
  FreeNavigationList: undefined;
  /** The free NumberField page; deep link `stackra://design-system/free/number-field`. */
  FreeNumberField: undefined;
  /** The free PageHeader page; deep link `stackra://design-system/free/page-header`. */
  FreePageHeader: undefined;
  /** The free PageSkeleton page; deep link `stackra://design-system/free/page-skeleton`. */
  FreePageSkeleton: undefined;
  /** The free Popover page; deep link `stackra://design-system/free/popover`. */
  FreePopover: undefined;
  /** The free ProgressBar page; deep link `stackra://design-system/free/progress-bar`. */
  FreeProgressBar: undefined;
  /** The free ProgressCircle page; deep link `stackra://design-system/free/progress-circle`. */
  FreeProgressCircle: undefined;
  /** The free PropertyList page; deep link `stackra://design-system/free/property-list`. */
  FreePropertyList: undefined;
  /** The free RadioGroup page; deep link `stackra://design-system/free/radio-group`. */
  FreeRadioGroup: undefined;
  /** The free SearchField page; deep link `stackra://design-system/free/search-field`. */
  FreeSearchField: undefined;
  /** The free Section page; deep link `stackra://design-system/free/section`. */
  FreeSection: undefined;
  /** The free Select page; deep link `stackra://design-system/free/select`. */
  FreeSelect: undefined;
  /** The free Separator page; deep link `stackra://design-system/free/separator`. */
  FreeSeparator: undefined;
  /** The free Skeleton page; deep link `stackra://design-system/free/skeleton`. */
  FreeSkeleton: undefined;
  /** The free Spinner page; deep link `stackra://design-system/free/spinner`. */
  FreeSpinner: undefined;
  /** The free StatusBadge page; deep link `stackra://design-system/free/status-badge`. */
  FreeStatusBadge: undefined;
  /** The free Surface page; deep link `stackra://design-system/free/surface`. */
  FreeSurface: undefined;
  /** The free Switch page; deep link `stackra://design-system/free/switch`. */
  FreeSwitch: undefined;
  /** The free Table page; deep link `stackra://design-system/free/table`. */
  FreeTable: undefined;
  /** The free Tabs page; deep link `stackra://design-system/free/tabs`. */
  FreeTabs: undefined;
  /** The free TagGroup page; deep link `stackra://design-system/free/tag-group`. */
  FreeTagGroup: undefined;
  /** The free TextArea page; deep link `stackra://design-system/free/text-area`. */
  FreeTextArea: undefined;
  /** The free TextField page; deep link `stackra://design-system/free/text-field`. */
  FreeTextField: undefined;
  /** The free Toast page; deep link `stackra://design-system/free/toast`. */
  FreeToast: undefined;
  /** The free Tooltip page; deep link `stackra://design-system/free/tooltip`. */
  FreeTooltip: undefined;
  /** The free Typography page; deep link `stackra://design-system/free/typography`. */
  FreeTypography: undefined;
  /** The free useConfirmation page; deep link `stackra://design-system/free/use-confirmation`. */
  FreeUseConfirmation: undefined;
  /** The ProgressButton page; deep link `stackra://design-system/pro/progress-button`. */
  ProProgressButton: undefined;
  /** The SlideButton page; deep link `stackra://design-system/pro/slide-button`. */
  ProSlideButton: undefined;
  /** The SwipeableRow page; deep link `stackra://design-system/pro/swipeable-row`. */
  ProSwipeableRow: undefined;
  /** The Calendar page; deep link `stackra://design-system/pro/calendar`. */
  ProCalendar: undefined;
  /** The DatePicker page; deep link `stackra://design-system/pro/date-picker`. */
  ProDatePicker: undefined;
  /** The NumberField page; deep link `stackra://design-system/pro/number-field`. */
  ProNumberField: undefined;
  /** The Agenda page; deep link `stackra://design-system/pro/agenda`. */
  ProAgenda: undefined;
  /** The AreaChart page; deep link `stackra://design-system/pro/area-chart`. */
  ProAreaChart: undefined;
  /** The Autocomplete page; deep link `stackra://design-system/pro/autocomplete`. */
  ProAutocomplete: undefined;
  /** The Badge page; deep link `stackra://design-system/pro/badge`. */
  ProBadge: undefined;
  /** The BarChart page; deep link `stackra://design-system/pro/bar-chart`. */
  ProBarChart: undefined;
  /** The Carousel page; deep link `stackra://design-system/pro/carousel`. */
  ProCarousel: undefined;
  /** The ChartCrosshair page; deep link `stackra://design-system/pro/chart-crosshair`. */
  ProChartCrosshair: undefined;
  /** The ChartIndicator page; deep link `stackra://design-system/pro/chart-indicator`. */
  ProChartIndicator: undefined;
  /** The ChartTooltip page; deep link `stackra://design-system/pro/chart-tooltip`. */
  ProChartTooltip: undefined;
  /** The ComboBox page; deep link `stackra://design-system/pro/combo-box`. */
  ProComboBox: undefined;
  /** The ComposedChart page; deep link `stackra://design-system/pro/composed-chart`. */
  ProComposedChart: undefined;
  /** The DateField page; deep link `stackra://design-system/pro/date-field`. */
  ProDateField: undefined;
  /** The DateRangePicker page; deep link `stackra://design-system/pro/date-range-picker`. */
  ProDateRangePicker: undefined;
  /** The DateTimePicker page; deep link `stackra://design-system/pro/date-time-picker`. */
  ProDateTimePicker: undefined;
  /** The EmptyState page; deep link `stackra://design-system/pro/empty-state`. */
  ProEmptyState: undefined;
  /** The FlipCard page; deep link `stackra://design-system/pro/flip-card`. */
  ProFlipCard: undefined;
  /** The FloatingActionButton page; deep link `stackra://design-system/pro/floating-action-button`. */
  ProFloatingActionButton: undefined;
  /** The LineChart page; deep link `stackra://design-system/pro/line-chart`. */
  ProLineChart: undefined;
  /** The MorphButton page; deep link `stackra://design-system/pro/morph-button`. */
  ProMorphButton: undefined;
  /** The MorphTabs page; deep link `stackra://design-system/pro/morph-tabs`. */
  ProMorphTabs: undefined;
  /** The NumberPad page; deep link `stackra://design-system/pro/number-pad`. */
  ProNumberPad: undefined;
  /** The NumberStepper page; deep link `stackra://design-system/pro/number-stepper`. */
  ProNumberStepper: undefined;
  /** The NumberValue page; deep link `stackra://design-system/pro/number-value`. */
  ProNumberValue: undefined;
  /** The PhoneNumberField page; deep link `stackra://design-system/pro/phone-number-field`. */
  ProPhoneNumberField: undefined;
  /** The PieChart page; deep link `stackra://design-system/pro/pie-chart`. */
  ProPieChart: undefined;
  /** The ProgressBar page; deep link `stackra://design-system/pro/progress-bar`. */
  ProProgressBar: undefined;
  /** The ProgressCircle page; deep link `stackra://design-system/pro/progress-circle`. */
  ProProgressCircle: undefined;
  /** The RadarChart page; deep link `stackra://design-system/pro/radar-chart`. */
  ProRadarChart: undefined;
  /** The RadialChart page; deep link `stackra://design-system/pro/radial-chart`. */
  ProRadialChart: undefined;
  /** The RadioButtonGroup page; deep link `stackra://design-system/pro/radio-button-group`. */
  ProRadioButtonGroup: undefined;
  /** The RangeCalendar page; deep link `stackra://design-system/pro/range-calendar`. */
  ProRangeCalendar: undefined;
  /** The Rating page; deep link `stackra://design-system/pro/rating`. */
  ProRating: undefined;
  /** The Segment page; deep link `stackra://design-system/pro/segment`. */
  ProSegment: undefined;
  /** The SocialAuthButton page; deep link `stackra://design-system/pro/social-auth-button`. */
  ProSocialAuthButton: undefined;
  /** The SplitView page; deep link `stackra://design-system/pro/split-view`. */
  ProSplitView: undefined;
  /** The StackedMeter page; deep link `stackra://design-system/pro/stacked-meter`. */
  ProStackedMeter: undefined;
  /** The Stepper page; deep link `stackra://design-system/pro/stepper`. */
  ProStepper: undefined;
  /** The SwipeableTabs page; deep link `stackra://design-system/pro/swipeable-tabs`. */
  ProSwipeableTabs: undefined;
  /** The Table page; deep link `stackra://design-system/pro/table`. */
  ProTable: undefined;
  /** The Timeline page; deep link `stackra://design-system/pro/timeline`. */
  ProTimeline: undefined;
  /** The TimePicker page; deep link `stackra://design-system/pro/time-picker`. */
  ProTimePicker: undefined;
  /** The ToggleButton page; deep link `stackra://design-system/pro/toggle-button`. */
  ProToggleButton: undefined;
  /** The ToggleButtonGroup page; deep link `stackra://design-system/pro/toggle-button-group`. */
  ProToggleButtonGroup: undefined;
  /** The TrendChip page; deep link `stackra://design-system/pro/trend-chip`. */
  ProTrendChip: undefined;
  /** The WheelDateTimePicker page; deep link `stackra://design-system/pro/wheel-date-time-picker`. */
  ProWheelDateTimePicker: undefined;
  /** The WheelPicker page; deep link `stackra://design-system/pro/wheel-picker`. */
  ProWheelPicker: undefined;
  /** The WheelPickerGroup page; deep link `stackra://design-system/pro/wheel-picker-group`. */
  ProWheelPickerGroup: undefined;
  /** The WheelTimePicker page; deep link `stackra://design-system/pro/wheel-time-picker`. */
  ProWheelTimePicker: undefined;
  /** The Widget page; deep link `stackra://design-system/pro/widget`. */
  ProWidget: undefined;
};

/** The routes of the Settings tab's stack and their params. */
export type SettingsStackParamList = {
  /** The Settings screen, the app's settings; takes no params. */
  Settings: undefined;
};

/** The routes that show one design-system component: every Home route except the home and the landing. */
export type DesignSystemComponentRoute = Exclude<keyof HomeStackParamList, "Home" | "DesignSystem">;

/** The tab routes; each tab holds the stack of its own screens. */
export type TabParamList = {
  /** The Home tab, whose params are the Home stack's. */
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  /** The Settings tab, whose params are the Settings stack's. */
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

/** The root stack: the tab shell and the item detail screen. */
export type RootStackParamList = {
  /** The tab shell, whose params are the tab routes'. */
  Tabs: NavigatorScreenParams<TabParamList>;
  /** Dynamic route: deep link `stackra://items/<id>`. */
  Item: { id: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
