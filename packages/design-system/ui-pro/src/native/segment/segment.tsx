/**
 * Stackra file contract:
 * Purpose: the native `Segment` compound on HeroUI Native Pro's Segment (a segmented control over `Tabs`): the root
 *          takes the shared `size` and `isDisabled`, `Segment.Group` (the tablist) names the control from `label`
 *          as the accessibility label, and every other part (Indicator, Item, Label, ScrollView, Separator) is
 *          HeroUI Native Pro's own; the `useSegment` hook comes with it. `value`, `defaultValue` and `onValueChange`
 *          pass through.
 * Boundary: no behaviour or styling of its own. The web `Segment` shares the contract but selects by `selectedKey`,
 *          as HeroUI Pro does. Imports the `segment` subpath.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import { Segment as HeroSegment } from "heroui-native-pro/segment";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SegmentProps } from "#native/segment/segment.props";
import type { SegmentGroupProps } from "#native/segment/segment-group.props";

/** The root: HeroUI Native Pro's, which holds the selection, the size and the disabled state. */
function SegmentRoot({ size, isDisabled, ...rest }: SegmentProps): ReactElement {
  return <HeroSegment {...rest} {...omitUndefined({ size, isDisabled })} />;
}

/** The row of items, the tablist: HeroUI Native Pro's, named by `label`. */
function SegmentGroup({ label, ...rest }: SegmentGroupProps): ReactElement {
  return <HeroSegment.Group {...rest} {...omitUndefined({ accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface SegmentParts {
  /** The row that holds the items, named by `label`. */
  readonly Group: typeof SegmentGroup;
  /** A horizontally scrollable row of items, for a control wider than the screen. */
  readonly ScrollView: typeof HeroSegment.ScrollView;
  /** The animated pill behind the selected item. */
  readonly Indicator: typeof HeroSegment.Indicator;
  /** One choice, identified by its `value`. */
  readonly Item: typeof HeroSegment.Item;
  /** The text of an item. */
  readonly Label: typeof HeroSegment.Label;
  /** A divider between two items. */
  readonly Separator: typeof HeroSegment.Separator;
}

/**
 * A segmented control: `Segment.Group` holds `Segment.Item` choices, each with a `Segment.Label`, and
 * `Segment.Indicator` marks the selected one. Name the control for screen readers with the group's `label`.
 */
export const Segment: typeof SegmentRoot & SegmentParts = Object.assign(SegmentRoot, {
  Group: SegmentGroup,
  ScrollView: HeroSegment.ScrollView,
  Indicator: HeroSegment.Indicator,
  Item: HeroSegment.Item,
  Label: HeroSegment.Label,
  Separator: HeroSegment.Separator,
});

export { useSegment } from "heroui-native-pro/segment";
