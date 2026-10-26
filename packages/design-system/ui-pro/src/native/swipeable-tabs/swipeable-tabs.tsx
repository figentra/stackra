/**
 * Stackra file contract:
 * Purpose: the native `SwipeableTabs` compound on HeroUI Native Pro's SwipeableTabs (tabs over a swipeable pager):
 *          `SwipeableTabs.List` (the tablist) names itself from `label` as the accessibility label; the root, with its
 *          `variant` and imperative `ref` (`goTo`), and every other part (ListBackground, ScrollView, Trigger, Label,
 *          Separator, Indicator, Pager, Content) are HeroUI Native Pro's own; the `useSwipeableTabs` hook comes
 *          with it.
 * Boundary: no behaviour or styling of its own. The root is a thin function so the compound never changes HeroUI
 *          Native Pro's own component. The pager needs `react-native-pager-view`. Imports the `swipeable-tabs`
 *          subpath.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import { SwipeableTabs as HeroSwipeableTabs } from "heroui-native-pro/swipeable-tabs";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SwipeableTabsProps } from "#native/swipeable-tabs/swipeable-tabs.props";
import type { SwipeableTabsListProps } from "#native/swipeable-tabs/swipeable-tabs-list.props";

/** The root: HeroUI Native Pro's, which owns the selected value and the pager position; its `ref` passes through. */
function SwipeableTabsRoot(props: SwipeableTabsProps): ReactElement {
  return <HeroSwipeableTabs {...props} />;
}

/** The row of tabs, the tablist: HeroUI Native Pro's, named by `label`. */
function SwipeableTabsList({ label, ...rest }: SwipeableTabsListProps): ReactElement {
  return <HeroSwipeableTabs.List {...rest} {...omitUndefined({ accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface SwipeableTabsParts {
  /** The tab row, named by `label`. */
  readonly List: typeof SwipeableTabsList;
  /** An optional themed layer behind the primary list surface. */
  readonly ListBackground: typeof HeroSwipeableTabs.ListBackground;
  /** An optional horizontally scrollable tab row, for a list wider than the screen. */
  readonly ScrollView: typeof HeroSwipeableTabs.ScrollView;
  /** A tab that selects its page, identified by its `value`. */
  readonly Trigger: typeof HeroSwipeableTabs.Trigger;
  /** The text of a trigger. */
  readonly Label: typeof HeroSwipeableTabs.Label;
  /** An optional divider between two triggers. */
  readonly Separator: typeof HeroSwipeableTabs.Separator;
  /** The marker that follows the pager position. */
  readonly Indicator: typeof HeroSwipeableTabs.Indicator;
  /** The swipeable pager that holds the pages. */
  readonly Pager: typeof HeroSwipeableTabs.Pager;
  /** One page of the pager. */
  readonly Content: typeof HeroSwipeableTabs.Content;
}

/**
 * Tabs over a swipeable pager: `SwipeableTabs.List` holds a `SwipeableTabs.Trigger` per page, and
 * `SwipeableTabs.Pager` holds the `SwipeableTabs.Content` pages. Name the tab list for screen readers with `label`.
 */
export const SwipeableTabs: typeof SwipeableTabsRoot & SwipeableTabsParts = Object.assign(
  SwipeableTabsRoot,
  {
    List: SwipeableTabsList,
    ListBackground: HeroSwipeableTabs.ListBackground,
    ScrollView: HeroSwipeableTabs.ScrollView,
    Trigger: HeroSwipeableTabs.Trigger,
    Label: HeroSwipeableTabs.Label,
    Separator: HeroSwipeableTabs.Separator,
    Indicator: HeroSwipeableTabs.Indicator,
    Pager: HeroSwipeableTabs.Pager,
    Content: HeroSwipeableTabs.Content,
  },
);

export { useSwipeableTabs } from "heroui-native-pro/swipeable-tabs";
