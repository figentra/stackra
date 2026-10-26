/**
 * Stackra file contract:
 * Purpose: the web `Timeline` compound on HeroUI Pro's Timeline (an ordered list of events along an axis): the root
 *          and the parts Item, Rail, Marker, Connector and Content, with HeroUI Pro's own names; `useItem` reads the
 *          item a part sits in.
 * Boundary: every prop passes through unchanged, `status` included. HeroUI Pro's Timeline finds its items, markers,
 *          rails and connectors by element type, to number the items and place the marker, so a wrapper around one
 *          of them would stop the numbering; `status` therefore keeps its HeroUI name instead of `tone`. The compound
 *          exposes the documented parts: HeroUI Pro's `Timeline.Root` is left out. Imports the `timeline` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { Timeline as HeroTimeline } from "@heroui-pro/react/timeline";
import type { TimelineProps } from "#react/timeline/timeline.props";

/** The root: HeroUI Pro's, an ordered list that numbers its `Timeline.Item` children. */
function TimelineRoot(props: TimelineProps) {
  return <HeroTimeline.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface TimelineParts {
  /** One event, tinted by its `status`. */
  readonly Item: typeof HeroTimeline.Item;
  /** The column that holds the marker and the connector. */
  readonly Rail: typeof HeroTimeline.Rail;
  /** The dot or icon that marks the event on the axis. */
  readonly Marker: typeof HeroTimeline.Marker;
  /** The line to the next event. */
  readonly Connector: typeof HeroTimeline.Connector;
  /** The event's text and any other content. */
  readonly Content: typeof HeroTimeline.Content;
}

/** A list of events along an axis: `Timeline.Item` holds `Marker`, `Connector` and `Content`. */
export const Timeline: typeof TimelineRoot & TimelineParts = Object.assign(TimelineRoot, {
  Item: HeroTimeline.Item,
  Rail: HeroTimeline.Rail,
  Marker: HeroTimeline.Marker,
  Connector: HeroTimeline.Connector,
  Content: HeroTimeline.Content,
});

export { useTimelineItem } from "@heroui-pro/react/timeline";
