/**
 * Stackra file contract:
 * Purpose: the one list of the components the design-system review area shows: its category, its tier, its title,
 *          its route and its screen. The index screen renders the categories from it and the Settings stack
 *          registers the routes from it, so a component is added in one place.
 * Boundary: data only; the screens and the route names live elsewhere. The category is one of the owner's catalogue
 *          categories (`ComponentCategory`); the tier is "Free", a `@stackra/ui/native` component (screens in
 *          `free/`, routes `Free*`), or "Pro", a `@stackra-pro/ui/native` component (screens in `pro/`, routes
 *          `Pro*`). The list is exported in gallery order (category, then Free before Pro, then title), the order
 *          the index lists the pages in and a page's pager walks them, so the order written below does not matter.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-403 FR-013.
 */

import { ComponentCategory } from "../enums/component-category.enum";
import { ComponentTier } from "../enums/component-tier.enum";
import { AccordionScreen } from "./free/accordion-screen";
import { ActionMenuScreen } from "./free/action-menu-screen";
import { AlertScreen } from "./free/alert-screen";
import { AlertDialogScreen } from "./free/alert-dialog-screen";
import { AvatarScreen } from "./free/avatar-screen";
import { BadgeScreen as FreeBadgeScreen } from "./free/badge-screen";
import { BreadcrumbsScreen } from "./free/breadcrumbs-screen";
import { BulkActionBarScreen } from "./free/bulk-action-bar-screen";
import { ButtonScreen } from "./free/button-screen";
import { CardScreen } from "./free/card-screen";
import { CheckboxScreen } from "./free/checkbox-screen";
import { CheckboxGroupScreen } from "./free/checkbox-group-screen";
import { ChipScreen } from "./free/chip-screen";
import { CloseButtonScreen } from "./free/close-button-screen";
import { ComboBoxScreen as FreeComboBoxScreen } from "./free/combo-box-screen";
import { DataTableScreen } from "./free/data-table-screen";
import { DateFieldScreen as FreeDateFieldScreen } from "./free/date-field-screen";
import { DatePickerScreen as FreeDatePickerScreen } from "./free/date-picker-screen";
import { DrawerScreen } from "./free/drawer-screen";
import { EmptyStateScreen as FreeEmptyStateScreen } from "./free/empty-state-screen";
import { EntityPickerScreen } from "./free/entity-picker-screen";
import { ErrorStateScreen } from "./free/error-state-screen";
import { FilterBarScreen } from "./free/filter-bar-screen";
import { FormScreen } from "./free/form-screen";
import { FormFieldScreen } from "./free/form-field-screen";
import { FormSectionScreen } from "./free/form-section-screen";
import { IconScreen } from "./free/icon-screen";
import { IconButtonScreen } from "./free/icon-button-screen";
import { InputGroupScreen } from "./free/input-group-screen";
import { LinkScreen } from "./free/link-screen";
import { ListScreen } from "./free/list-screen";
import { MenuScreen } from "./free/menu-screen";
import { ModalScreen } from "./free/modal-screen";
import { NavigationListScreen } from "./free/navigation-list-screen";
import { NumberFieldScreen as FreeNumberFieldScreen } from "./free/number-field-screen";
import { PageHeaderScreen } from "./free/page-header-screen";
import { PageSkeletonScreen } from "./free/page-skeleton-screen";
import { PopoverScreen } from "./free/popover-screen";
import { ProgressBarScreen as FreeProgressBarScreen } from "./free/progress-bar-screen";
import { ProgressCircleScreen as FreeProgressCircleScreen } from "./free/progress-circle-screen";
import { PropertyListScreen } from "./free/property-list-screen";
import { RadioGroupScreen } from "./free/radio-group-screen";
import { RevealScreen } from "./free/reveal-screen";
import { SearchFieldScreen } from "./free/search-field-screen";
import { SectionScreen } from "./free/section-screen";
import { SelectScreen } from "./free/select-screen";
import { SeparatorScreen } from "./free/separator-screen";
import { SkeletonScreen } from "./free/skeleton-screen";
import { SpinnerScreen } from "./free/spinner-screen";
import { StatusBadgeScreen } from "./free/status-badge-screen";
import { SurfaceScreen } from "./free/surface-screen";
import { SwitchScreen } from "./free/switch-screen";
import { TableScreen as FreeTableScreen } from "./free/table-screen";
import { TabsScreen } from "./free/tabs-screen";
import { TagGroupScreen } from "./free/tag-group-screen";
import { TextAreaScreen } from "./free/text-area-screen";
import { TextFieldScreen } from "./free/text-field-screen";
import { ToastScreen } from "./free/toast-screen";
import { TooltipScreen } from "./free/tooltip-screen";
import { TypographyScreen } from "./free/typography-screen";
import { UseConfirmationScreen } from "./free/use-confirmation-screen";
import { CalendarScreen } from "./pro/calendar-screen";
import { DatePickerScreen } from "./pro/date-picker-screen";
import { NumberFieldScreen } from "./pro/number-field-screen";
import { ProgressButtonScreen } from "./pro/progress-button-screen";
import { SlideButtonScreen } from "./pro/slide-button-screen";
import { SwipeableRowScreen } from "./pro/swipeable-row-screen";
import { AgendaScreen } from "./pro/agenda-screen";
import { AreaChartScreen } from "./pro/area-chart-screen";
import { AutocompleteScreen } from "./pro/autocomplete-screen";
import { BadgeScreen } from "./pro/badge-screen";
import { BarChartScreen } from "./pro/bar-chart-screen";
import { CarouselScreen } from "./pro/carousel-screen";
import { ChartCrosshairScreen } from "./pro/chart-crosshair-screen";
import { ChartIndicatorScreen } from "./pro/chart-indicator-screen";
import { ChartTooltipScreen } from "./pro/chart-tooltip-screen";
import { ComboBoxScreen } from "./pro/combo-box-screen";
import { ComposedChartScreen } from "./pro/composed-chart-screen";
import { DateFieldScreen } from "./pro/date-field-screen";
import { DateRangePickerScreen } from "./pro/date-range-picker-screen";
import { DateTimePickerScreen } from "./pro/date-time-picker-screen";
import { EmptyStateScreen } from "./pro/empty-state-screen";
import { FlipCardScreen } from "./pro/flip-card-screen";
import { FloatingActionButtonScreen } from "./pro/floating-action-button-screen";
import { LineChartScreen } from "./pro/line-chart-screen";
import { MorphButtonScreen } from "./pro/morph-button-screen";
import { MorphTabsScreen } from "./pro/morph-tabs-screen";
import { NumberPadScreen } from "./pro/number-pad-screen";
import { NumberStepperScreen } from "./pro/number-stepper-screen";
import { NumberValueScreen } from "./pro/number-value-screen";
import { PhoneNumberFieldScreen } from "./pro/phone-number-field-screen";
import { PieChartScreen } from "./pro/pie-chart-screen";
import { ProgressBarScreen } from "./pro/progress-bar-screen";
import { ProgressCircleScreen } from "./pro/progress-circle-screen";
import { RadarChartScreen } from "./pro/radar-chart-screen";
import { RadialChartScreen } from "./pro/radial-chart-screen";
import { RadioButtonGroupScreen } from "./pro/radio-button-group-screen";
import { RangeCalendarScreen } from "./pro/range-calendar-screen";
import { RatingScreen } from "./pro/rating-screen";
import { SegmentScreen } from "./pro/segment-screen";
import { SocialAuthButtonScreen } from "./pro/social-auth-button-screen";
import { SplitViewScreen } from "./pro/split-view-screen";
import { StackedMeterScreen } from "./pro/stacked-meter-screen";
import { StepperScreen } from "./pro/stepper-screen";
import { SwipeableTabsScreen } from "./pro/swipeable-tabs-screen";
import { TableScreen } from "./pro/table-screen";
import { TimelineScreen } from "./pro/timeline-screen";
import { AiMarkScreen } from "./free/ai-mark-screen";
import { EnvironmentBannerScreen } from "./free/environment-banner-screen";
import { ModeSwitchScreen } from "./free/mode-switch-screen";
import { AssistantPanelScreen } from "./pro/assistant-panel-screen";
import { ApprovalCardScreen } from "./pro/approval-card-screen";
import { PlanViewScreen } from "./pro/plan-view-screen";
import { ResourceSchedulerScreen } from "./pro/resource-scheduler-screen";
import { SignatureFieldScreen } from "./pro/signature-field-screen";
import { TimePickerScreen } from "./pro/time-picker-screen";
import { ToggleButtonScreen } from "./pro/toggle-button-screen";
import { ToggleButtonGroupScreen } from "./pro/toggle-button-group-screen";
import { TrendChipScreen } from "./pro/trend-chip-screen";
import { WheelDateTimePickerScreen } from "./pro/wheel-date-time-picker-screen";
import { WheelPickerScreen } from "./pro/wheel-picker-screen";
import { WheelPickerGroupScreen } from "./pro/wheel-picker-group-screen";
import { WheelTimePickerScreen } from "./pro/wheel-time-picker-screen";
import { WidgetScreen } from "./pro/widget-screen";
import type { DesignSystemComponent } from "../types/design-system-component.type";

/** The components as written, in no particular order. */
const COMPONENTS: readonly DesignSystemComponent[] = [
  // Free
  {
    category: "AI",
    tier: "Free",
    title: "AiMark",
    route: "FreeAiMark",
    screen: AiMarkScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "EnvironmentBanner",
    route: "FreeEnvironmentBanner",
    screen: EnvironmentBannerScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Free",
    title: "ModeSwitch",
    route: "FreeModeSwitch",
    screen: ModeSwitchScreen,
  },
  { category: "Foundations", tier: "Free", title: "Icon", route: "FreeIcon", screen: IconScreen },
  {
    category: "Foundations",
    tier: "Free",
    title: "Reveal",
    route: "FreeReveal",
    screen: RevealScreen,
  },
  {
    category: "Foundations",
    tier: "Free",
    title: "Typography",
    route: "FreeTypography",
    screen: TypographyScreen,
  },
  { category: "Actions", tier: "Free", title: "Button", route: "FreeButton", screen: ButtonScreen },
  {
    category: "Actions",
    tier: "Free",
    title: "CloseButton",
    route: "FreeCloseButton",
    screen: CloseButtonScreen,
  },
  {
    category: "Actions",
    tier: "Free",
    title: "IconButton",
    route: "FreeIconButton",
    screen: IconButtonScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Free",
    title: "Form",
    route: "FreeForm",
    screen: FormScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Free",
    title: "FormField",
    route: "FreeFormField",
    screen: FormFieldScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Free",
    title: "FormSection",
    route: "FreeFormSection",
    screen: FormSectionScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Free",
    title: "InputGroup",
    route: "FreeInputGroup",
    screen: InputGroupScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Free",
    title: "SearchField",
    route: "FreeSearchField",
    screen: SearchFieldScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Free",
    title: "TextArea",
    route: "FreeTextArea",
    screen: TextAreaScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Free",
    title: "TextField",
    route: "FreeTextField",
    screen: TextFieldScreen,
  },
  {
    category: "Selection",
    tier: "Free",
    title: "Checkbox",
    route: "FreeCheckbox",
    screen: CheckboxScreen,
  },
  {
    category: "Selection",
    tier: "Free",
    title: "CheckboxGroup",
    route: "FreeCheckboxGroup",
    screen: CheckboxGroupScreen,
  },
  {
    category: "Selection",
    tier: "Free",
    title: "ComboBox",
    route: "FreeComboBox",
    screen: FreeComboBoxScreen,
  },
  {
    category: "Selection",
    tier: "Free",
    title: "RadioGroup",
    route: "FreeRadioGroup",
    screen: RadioGroupScreen,
  },
  {
    category: "Selection",
    tier: "Free",
    title: "Select",
    route: "FreeSelect",
    screen: SelectScreen,
  },
  {
    category: "Selection",
    tier: "Free",
    title: "Switch",
    route: "FreeSwitch",
    screen: SwitchScreen,
  },
  {
    category: "Selection",
    tier: "Free",
    title: "TagGroup",
    route: "FreeTagGroup",
    screen: TagGroupScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "Avatar",
    route: "FreeAvatar",
    screen: AvatarScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "Badge",
    route: "FreeBadge",
    screen: FreeBadgeScreen,
  },
  { category: "Data display", tier: "Free", title: "Card", route: "FreeCard", screen: CardScreen },
  { category: "Data display", tier: "Free", title: "Chip", route: "FreeChip", screen: ChipScreen },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "Skeleton",
    route: "FreeSkeleton",
    screen: SkeletonScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "Spinner",
    route: "FreeSpinner",
    screen: SpinnerScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "StatusBadge",
    route: "FreeStatusBadge",
    screen: StatusBadgeScreen,
  },
  { category: "Navigation", tier: "Free", title: "Link", route: "FreeLink", screen: LinkScreen },
  {
    category: "Layout",
    tier: "Free",
    title: "Separator",
    route: "FreeSeparator",
    screen: SeparatorScreen,
  },
  {
    category: "Layout",
    tier: "Free",
    title: "Surface",
    route: "FreeSurface",
    screen: SurfaceScreen,
  },

  {
    category: "Inputs and forms",
    tier: "Free",
    title: "NumberField",
    route: "FreeNumberField",
    screen: FreeNumberFieldScreen,
  },
  {
    category: "Selection",
    tier: "Free",
    title: "EntityPicker",
    route: "FreeEntityPicker",
    screen: EntityPickerScreen,
  },
  {
    category: "Date and time",
    tier: "Free",
    title: "DateField",
    route: "FreeDateField",
    screen: FreeDateFieldScreen,
  },
  {
    category: "Date and time",
    tier: "Free",
    title: "DatePicker",
    route: "FreeDatePicker",
    screen: FreeDatePickerScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "Accordion",
    route: "FreeAccordion",
    screen: AccordionScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "BulkActionBar",
    route: "FreeBulkActionBar",
    screen: BulkActionBarScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "DataTable",
    route: "FreeDataTable",
    screen: DataTableScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "FilterBar",
    route: "FreeFilterBar",
    screen: FilterBarScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "List",
    route: "FreeList",
    screen: ListScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "PropertyList",
    route: "FreePropertyList",
    screen: PropertyListScreen,
  },
  {
    category: "Data display",
    tier: "Free",
    title: "Table",
    route: "FreeTable",
    screen: FreeTableScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "Alert",
    route: "FreeAlert",
    screen: AlertScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "EmptyState",
    route: "FreeEmptyState",
    screen: FreeEmptyStateScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "ErrorState",
    route: "FreeErrorState",
    screen: ErrorStateScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "PageSkeleton",
    route: "FreePageSkeleton",
    screen: PageSkeletonScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "ProgressBar",
    route: "FreeProgressBar",
    screen: FreeProgressBarScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "ProgressCircle",
    route: "FreeProgressCircle",
    screen: FreeProgressCircleScreen,
  },
  {
    category: "Feedback and status",
    tier: "Free",
    title: "Toast",
    route: "FreeToast",
    screen: ToastScreen,
  },
  {
    category: "Navigation",
    tier: "Free",
    title: "Breadcrumbs",
    route: "FreeBreadcrumbs",
    screen: BreadcrumbsScreen,
  },
  {
    category: "Navigation",
    tier: "Free",
    title: "NavigationList",
    route: "FreeNavigationList",
    screen: NavigationListScreen,
  },
  {
    category: "Navigation",
    tier: "Free",
    title: "Tabs",
    route: "FreeTabs",
    screen: TabsScreen,
  },
  {
    category: "Overlays",
    tier: "Free",
    title: "ActionMenu",
    route: "FreeActionMenu",
    screen: ActionMenuScreen,
  },
  {
    category: "Overlays",
    tier: "Free",
    title: "AlertDialog",
    route: "FreeAlertDialog",
    screen: AlertDialogScreen,
  },
  {
    category: "Overlays",
    tier: "Free",
    title: "Drawer",
    route: "FreeDrawer",
    screen: DrawerScreen,
  },
  {
    category: "Overlays",
    tier: "Free",
    title: "Menu",
    route: "FreeMenu",
    screen: MenuScreen,
  },
  {
    category: "Overlays",
    tier: "Free",
    title: "Modal",
    route: "FreeModal",
    screen: ModalScreen,
  },
  {
    category: "Overlays",
    tier: "Free",
    title: "Popover",
    route: "FreePopover",
    screen: PopoverScreen,
  },
  {
    category: "Overlays",
    tier: "Free",
    title: "Tooltip",
    route: "FreeTooltip",
    screen: TooltipScreen,
  },
  {
    category: "Overlays",
    tier: "Free",
    title: "useConfirmation",
    route: "FreeUseConfirmation",
    screen: UseConfirmationScreen,
  },
  {
    category: "Layout",
    tier: "Free",
    title: "PageHeader",
    route: "FreePageHeader",
    screen: PageHeaderScreen,
  },
  {
    category: "Layout",
    tier: "Free",
    title: "Section",
    route: "FreeSection",
    screen: SectionScreen,
  },

  // Pro
  {
    category: "AI",
    tier: "Pro",
    title: "AssistantPanel",
    route: "ProAssistantPanel",
    screen: AssistantPanelScreen,
  },
  {
    category: "AI",
    tier: "Pro",
    title: "ApprovalCard",
    route: "ProApprovalCard",
    screen: ApprovalCardScreen,
  },
  {
    category: "AI",
    tier: "Pro",
    title: "PlanView",
    route: "ProPlanView",
    screen: PlanViewScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "ResourceScheduler",
    route: "ProResourceScheduler",
    screen: ResourceSchedulerScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Pro",
    title: "SignatureField",
    route: "ProSignatureField",
    screen: SignatureFieldScreen,
  },
  {
    category: "Actions",
    tier: "Pro",
    title: "FloatingActionButton",
    route: "ProFloatingActionButton",
    screen: FloatingActionButtonScreen,
  },
  {
    category: "Actions",
    tier: "Pro",
    title: "MorphButton",
    route: "ProMorphButton",
    screen: MorphButtonScreen,
  },
  {
    category: "Actions",
    tier: "Pro",
    title: "ProgressButton",
    route: "ProProgressButton",
    screen: ProgressButtonScreen,
  },
  {
    category: "Actions",
    tier: "Pro",
    title: "SlideButton",
    route: "ProSlideButton",
    screen: SlideButtonScreen,
  },
  {
    category: "Actions",
    tier: "Pro",
    title: "SocialAuthButton",
    route: "ProSocialAuthButton",
    screen: SocialAuthButtonScreen,
  },
  {
    category: "Actions",
    tier: "Pro",
    title: "ToggleButton",
    route: "ProToggleButton",
    screen: ToggleButtonScreen,
  },
  {
    category: "Actions",
    tier: "Pro",
    title: "ToggleButtonGroup",
    route: "ProToggleButtonGroup",
    screen: ToggleButtonGroupScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Pro",
    title: "NumberField",
    route: "ProNumberField",
    screen: NumberFieldScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Pro",
    title: "NumberPad",
    route: "ProNumberPad",
    screen: NumberPadScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Pro",
    title: "NumberStepper",
    route: "ProNumberStepper",
    screen: NumberStepperScreen,
  },
  {
    category: "Inputs and forms",
    tier: "Pro",
    title: "PhoneNumberField",
    route: "ProPhoneNumberField",
    screen: PhoneNumberFieldScreen,
  },
  {
    category: "Selection",
    tier: "Pro",
    title: "Autocomplete",
    route: "ProAutocomplete",
    screen: AutocompleteScreen,
  },
  {
    category: "Selection",
    tier: "Pro",
    title: "ComboBox",
    route: "ProComboBox",
    screen: ComboBoxScreen,
  },
  {
    category: "Selection",
    tier: "Pro",
    title: "RadioButtonGroup",
    route: "ProRadioButtonGroup",
    screen: RadioButtonGroupScreen,
  },
  {
    category: "Selection",
    tier: "Pro",
    title: "WheelPicker",
    route: "ProWheelPicker",
    screen: WheelPickerScreen,
  },
  {
    category: "Selection",
    tier: "Pro",
    title: "WheelPickerGroup",
    route: "ProWheelPickerGroup",
    screen: WheelPickerGroupScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "Agenda",
    route: "ProAgenda",
    screen: AgendaScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "Calendar",
    route: "ProCalendar",
    screen: CalendarScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "DateField",
    route: "ProDateField",
    screen: DateFieldScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "DatePicker",
    route: "ProDatePicker",
    screen: DatePickerScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "DateRangePicker",
    route: "ProDateRangePicker",
    screen: DateRangePickerScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "DateTimePicker",
    route: "ProDateTimePicker",
    screen: DateTimePickerScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "RangeCalendar",
    route: "ProRangeCalendar",
    screen: RangeCalendarScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "TimePicker",
    route: "ProTimePicker",
    screen: TimePickerScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "WheelDateTimePicker",
    route: "ProWheelDateTimePicker",
    screen: WheelDateTimePickerScreen,
  },
  {
    category: "Date and time",
    tier: "Pro",
    title: "WheelTimePicker",
    route: "ProWheelTimePicker",
    screen: WheelTimePickerScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "AreaChart",
    route: "ProAreaChart",
    screen: AreaChartScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "BarChart",
    route: "ProBarChart",
    screen: BarChartScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "ChartCrosshair",
    route: "ProChartCrosshair",
    screen: ChartCrosshairScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "ChartIndicator",
    route: "ProChartIndicator",
    screen: ChartIndicatorScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "ChartTooltip",
    route: "ProChartTooltip",
    screen: ChartTooltipScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "ComposedChart",
    route: "ProComposedChart",
    screen: ComposedChartScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "LineChart",
    route: "ProLineChart",
    screen: LineChartScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "PieChart",
    route: "ProPieChart",
    screen: PieChartScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "RadarChart",
    route: "ProRadarChart",
    screen: RadarChartScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "RadialChart",
    route: "ProRadialChart",
    screen: RadialChartScreen,
  },
  {
    category: "Charts",
    tier: "Pro",
    title: "StackedMeter",
    route: "ProStackedMeter",
    screen: StackedMeterScreen,
  },
  { category: "Data display", tier: "Pro", title: "Badge", route: "ProBadge", screen: BadgeScreen },
  {
    category: "Data display",
    tier: "Pro",
    title: "Carousel",
    route: "ProCarousel",
    screen: CarouselScreen,
  },
  {
    category: "Data display",
    tier: "Pro",
    title: "EmptyState",
    route: "ProEmptyState",
    screen: EmptyStateScreen,
  },
  {
    category: "Data display",
    tier: "Pro",
    title: "FlipCard",
    route: "ProFlipCard",
    screen: FlipCardScreen,
  },
  {
    category: "Data display",
    tier: "Pro",
    title: "SwipeableRow",
    route: "ProSwipeableRow",
    screen: SwipeableRowScreen,
  },
  { category: "Data display", tier: "Pro", title: "Table", route: "ProTable", screen: TableScreen },
  {
    category: "Data display",
    tier: "Pro",
    title: "Timeline",
    route: "ProTimeline",
    screen: TimelineScreen,
  },
  {
    category: "Data display",
    tier: "Pro",
    title: "Widget",
    route: "ProWidget",
    screen: WidgetScreen,
  },
  {
    category: "Feedback and status",
    tier: "Pro",
    title: "NumberValue",
    route: "ProNumberValue",
    screen: NumberValueScreen,
  },
  {
    category: "Feedback and status",
    tier: "Pro",
    title: "ProgressBar",
    route: "ProProgressBar",
    screen: ProgressBarScreen,
  },
  {
    category: "Feedback and status",
    tier: "Pro",
    title: "ProgressCircle",
    route: "ProProgressCircle",
    screen: ProgressCircleScreen,
  },
  {
    category: "Feedback and status",
    tier: "Pro",
    title: "Rating",
    route: "ProRating",
    screen: RatingScreen,
  },
  {
    category: "Feedback and status",
    tier: "Pro",
    title: "TrendChip",
    route: "ProTrendChip",
    screen: TrendChipScreen,
  },
  {
    category: "Navigation",
    tier: "Pro",
    title: "MorphTabs",
    route: "ProMorphTabs",
    screen: MorphTabsScreen,
  },
  {
    category: "Navigation",
    tier: "Pro",
    title: "Segment",
    route: "ProSegment",
    screen: SegmentScreen,
  },
  {
    category: "Navigation",
    tier: "Pro",
    title: "SplitView",
    route: "ProSplitView",
    screen: SplitViewScreen,
  },
  {
    category: "Navigation",
    tier: "Pro",
    title: "Stepper",
    route: "ProStepper",
    screen: StepperScreen,
  },
  {
    category: "Navigation",
    tier: "Pro",
    title: "SwipeableTabs",
    route: "ProSwipeableTabs",
    screen: SwipeableTabsScreen,
  },
];

/** The components of the review area in gallery order: by category, then Free before Pro, then by title. */
export const DESIGN_SYSTEM_COMPONENTS: readonly DesignSystemComponent[] = [...COMPONENTS].sort(
  (a, b) =>
    ComponentCategory.indexOf(a.category) - ComponentCategory.indexOf(b.category) ||
    ComponentTier.indexOf(a.tier) - ComponentTier.indexOf(b.tier) ||
    a.title.localeCompare(b.title, "en"),
);
