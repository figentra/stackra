/**
 * Stackra file contract:
 * Purpose: the one list of the components the design-system review area shows: its group, its title, its route and
 *          its screen. The index screen renders the groups from it and the Settings stack registers the routes
 *          from it, so a component is added in one place.
 * Boundary: data only; the screens and the route names live elsewhere. Today the only group is "Pro", every
 *          `@stackra/ui-pro/native` component; the free `@stackra/ui` components join it as their waves merge.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-403 FR-013.
 */
import type { ReactElement } from "react";

import type { DesignSystemComponentRoute } from "../navigation/types";
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
import { TimePickerScreen } from "./pro/time-picker-screen";
import { ToggleButtonScreen } from "./pro/toggle-button-screen";
import { ToggleButtonGroupScreen } from "./pro/toggle-button-group-screen";
import { TrendChipScreen } from "./pro/trend-chip-screen";
import { WheelDateTimePickerScreen } from "./pro/wheel-date-time-picker-screen";
import { WheelPickerScreen } from "./pro/wheel-picker-screen";
import { WheelPickerGroupScreen } from "./pro/wheel-picker-group-screen";
import { WheelTimePickerScreen } from "./pro/wheel-time-picker-screen";
import { WidgetScreen } from "./pro/widget-screen";

/** The groups the index lists, in the order they appear: add `"Free"` or a wave's name here when it merges. */
export type DesignSystemGroup = "Pro";

/** One component of the review area. */
export interface DesignSystemComponent {
  /** The section of the index the component is listed under. */
  group: DesignSystemGroup;
  /** The component's name, shown in the list and as the page title. */
  title: string;
  /** The Settings stack route of the component's page. */
  route: DesignSystemComponentRoute;
  /** The page that shows the component. */
  screen: () => ReactElement;
}

/** The components of the review area, in list order; the index groups them by `group`. */
export const DESIGN_SYSTEM_COMPONENTS: readonly DesignSystemComponent[] = [
  {
    group: "Pro",
    title: "ProgressButton",
    route: "ProProgressButton",
    screen: ProgressButtonScreen,
  },
  { group: "Pro", title: "SlideButton", route: "ProSlideButton", screen: SlideButtonScreen },
  { group: "Pro", title: "SwipeableRow", route: "ProSwipeableRow", screen: SwipeableRowScreen },
  { group: "Pro", title: "Calendar", route: "ProCalendar", screen: CalendarScreen },
  { group: "Pro", title: "DatePicker", route: "ProDatePicker", screen: DatePickerScreen },
  { group: "Pro", title: "NumberField", route: "ProNumberField", screen: NumberFieldScreen },
  { group: "Pro", title: "Agenda", route: "ProAgenda", screen: AgendaScreen },
  { group: "Pro", title: "AreaChart", route: "ProAreaChart", screen: AreaChartScreen },
  { group: "Pro", title: "Autocomplete", route: "ProAutocomplete", screen: AutocompleteScreen },
  { group: "Pro", title: "Badge", route: "ProBadge", screen: BadgeScreen },
  { group: "Pro", title: "BarChart", route: "ProBarChart", screen: BarChartScreen },
  { group: "Pro", title: "Carousel", route: "ProCarousel", screen: CarouselScreen },
  {
    group: "Pro",
    title: "ChartCrosshair",
    route: "ProChartCrosshair",
    screen: ChartCrosshairScreen,
  },
  {
    group: "Pro",
    title: "ChartIndicator",
    route: "ProChartIndicator",
    screen: ChartIndicatorScreen,
  },
  { group: "Pro", title: "ChartTooltip", route: "ProChartTooltip", screen: ChartTooltipScreen },
  { group: "Pro", title: "ComboBox", route: "ProComboBox", screen: ComboBoxScreen },
  { group: "Pro", title: "ComposedChart", route: "ProComposedChart", screen: ComposedChartScreen },
  { group: "Pro", title: "DateField", route: "ProDateField", screen: DateFieldScreen },
  {
    group: "Pro",
    title: "DateRangePicker",
    route: "ProDateRangePicker",
    screen: DateRangePickerScreen,
  },
  {
    group: "Pro",
    title: "DateTimePicker",
    route: "ProDateTimePicker",
    screen: DateTimePickerScreen,
  },
  { group: "Pro", title: "EmptyState", route: "ProEmptyState", screen: EmptyStateScreen },
  { group: "Pro", title: "FlipCard", route: "ProFlipCard", screen: FlipCardScreen },
  {
    group: "Pro",
    title: "FloatingActionButton",
    route: "ProFloatingActionButton",
    screen: FloatingActionButtonScreen,
  },
  { group: "Pro", title: "LineChart", route: "ProLineChart", screen: LineChartScreen },
  { group: "Pro", title: "MorphButton", route: "ProMorphButton", screen: MorphButtonScreen },
  { group: "Pro", title: "MorphTabs", route: "ProMorphTabs", screen: MorphTabsScreen },
  { group: "Pro", title: "NumberPad", route: "ProNumberPad", screen: NumberPadScreen },
  { group: "Pro", title: "NumberStepper", route: "ProNumberStepper", screen: NumberStepperScreen },
  { group: "Pro", title: "NumberValue", route: "ProNumberValue", screen: NumberValueScreen },
  {
    group: "Pro",
    title: "PhoneNumberField",
    route: "ProPhoneNumberField",
    screen: PhoneNumberFieldScreen,
  },
  { group: "Pro", title: "PieChart", route: "ProPieChart", screen: PieChartScreen },
  { group: "Pro", title: "ProgressBar", route: "ProProgressBar", screen: ProgressBarScreen },
  {
    group: "Pro",
    title: "ProgressCircle",
    route: "ProProgressCircle",
    screen: ProgressCircleScreen,
  },
  { group: "Pro", title: "RadarChart", route: "ProRadarChart", screen: RadarChartScreen },
  { group: "Pro", title: "RadialChart", route: "ProRadialChart", screen: RadialChartScreen },
  {
    group: "Pro",
    title: "RadioButtonGroup",
    route: "ProRadioButtonGroup",
    screen: RadioButtonGroupScreen,
  },
  { group: "Pro", title: "RangeCalendar", route: "ProRangeCalendar", screen: RangeCalendarScreen },
  { group: "Pro", title: "Rating", route: "ProRating", screen: RatingScreen },
  { group: "Pro", title: "Segment", route: "ProSegment", screen: SegmentScreen },
  {
    group: "Pro",
    title: "SocialAuthButton",
    route: "ProSocialAuthButton",
    screen: SocialAuthButtonScreen,
  },
  { group: "Pro", title: "SplitView", route: "ProSplitView", screen: SplitViewScreen },
  { group: "Pro", title: "StackedMeter", route: "ProStackedMeter", screen: StackedMeterScreen },
  { group: "Pro", title: "Stepper", route: "ProStepper", screen: StepperScreen },
  { group: "Pro", title: "SwipeableTabs", route: "ProSwipeableTabs", screen: SwipeableTabsScreen },
  { group: "Pro", title: "Table", route: "ProTable", screen: TableScreen },
  { group: "Pro", title: "Timeline", route: "ProTimeline", screen: TimelineScreen },
  { group: "Pro", title: "TimePicker", route: "ProTimePicker", screen: TimePickerScreen },
  { group: "Pro", title: "ToggleButton", route: "ProToggleButton", screen: ToggleButtonScreen },
  {
    group: "Pro",
    title: "ToggleButtonGroup",
    route: "ProToggleButtonGroup",
    screen: ToggleButtonGroupScreen,
  },
  { group: "Pro", title: "TrendChip", route: "ProTrendChip", screen: TrendChipScreen },
  {
    group: "Pro",
    title: "WheelDateTimePicker",
    route: "ProWheelDateTimePicker",
    screen: WheelDateTimePickerScreen,
  },
  { group: "Pro", title: "WheelPicker", route: "ProWheelPicker", screen: WheelPickerScreen },
  {
    group: "Pro",
    title: "WheelPickerGroup",
    route: "ProWheelPickerGroup",
    screen: WheelPickerGroupScreen,
  },
  {
    group: "Pro",
    title: "WheelTimePicker",
    route: "ProWheelTimePicker",
    screen: WheelTimePickerScreen,
  },
  { group: "Pro", title: "Widget", route: "ProWidget", screen: WidgetScreen },
];
