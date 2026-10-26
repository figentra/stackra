/**
 * Stackra file contract:
 * Purpose: the native `Timeline` compound on HeroUI Native Pro's Timeline (a list of events along an axis): the root
 *          and the parts Item, Leading, Rail, Marker, Connector, Content, Title and Description, with HeroUI Native
 *          Pro's own names; `useTimeline` and `useTimelineItem` read the root and the item a part sits in.
 * Boundary: every prop passes through unchanged, `status` included. HeroUI Native Pro's Timeline finds its items by
 *          element type, to number them and mark the last, so a wrapper around `Item` would stop the numbering;
 *          `status` therefore keeps its HeroUI name instead of `tone`. The compound exposes the parts of HeroUI
 *          Native Pro, its own components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { Timeline as HeroTimeline } from "heroui-native-pro/timeline";
import type { ReactElement } from "react";
import type { TimelineProps } from "#native/timeline/timeline.props";

/** The root: HeroUI Native Pro's, which numbers its `Timeline.Item` children. */
function TimelineRoot(props: TimelineProps): ReactElement {
  return <HeroTimeline {...props} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface TimelineParts {
  /** One event, tinted by its `status`. */
  readonly Item: typeof HeroTimeline.Item;
  /** The area before the rail, for a time or an avatar. */
  readonly Leading: typeof HeroTimeline.Leading;
  /** The column that holds the marker and the connector. */
  readonly Rail: typeof HeroTimeline.Rail;
  /** The dot or icon that marks the event on the axis. */
  readonly Marker: typeof HeroTimeline.Marker;
  /** The line to the next event. */
  readonly Connector: typeof HeroTimeline.Connector;
  /** The event's text and any other content. */
  readonly Content: typeof HeroTimeline.Content;
  /** The event's title. */
  readonly Title: typeof HeroTimeline.Title;
  /** The event's supporting text. */
  readonly Description: typeof HeroTimeline.Description;
}

/** A list of events along an axis: `Timeline.Item` holds `Rail`, `Leading` and `Content`. */
export const Timeline: typeof TimelineRoot & TimelineParts = Object.assign(TimelineRoot, {
  Item: HeroTimeline.Item,
  Leading: HeroTimeline.Leading,
  Rail: HeroTimeline.Rail,
  Marker: HeroTimeline.Marker,
  Connector: HeroTimeline.Connector,
  Content: HeroTimeline.Content,
  Title: HeroTimeline.Title,
  Description: HeroTimeline.Description,
});

export { useTimeline, useTimelineItem } from "heroui-native-pro/timeline";
