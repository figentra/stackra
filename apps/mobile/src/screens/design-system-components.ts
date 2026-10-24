/**
 * Stackra file contract:
 * Purpose: the one list of the components the design-system review area shows: its group, its title, its route and
 *          its screen. The index screen renders the groups from it and the Settings stack registers the routes
 *          from it, so a component is added in one place.
 * Boundary: data only; the screens and the route names live elsewhere. Today the only group is "Pro", the six
 *          `@stackra/ui-pro/native` components; the free `@stackra/ui` components join it as their waves merge.
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
];
