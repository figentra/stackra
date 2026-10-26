/**
 * Stackra file contract:
 * Purpose: the web `Segment` compound on HeroUI Pro's Segment (a segmented control): the root takes the shared `size`
 *          and `isDisabled`, and names the control from `label`; `Item` and `Separator` are HeroUI Pro's own.
 *          HeroUI Pro's `selectedKey`, `defaultSelectedKey` and `onSelectionChange`, and its `default` and `ghost`
 *          variants, pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The native `Segment` shares
 *          the contract but selects by `value`, as HeroUI Native Pro does. The compound exposes the documented parts:
 *          HeroUI Pro's `Segment.Root` is left out. Imports the `segment` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import { Segment as HeroSegment } from "@heroui-pro/react/segment";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SegmentProps } from "#react/segment/segment.props";

/** The control: HeroUI Pro's `Segment.Root`, a toggle group named by `label`. */
function SegmentRoot({ size, isDisabled, label, ...rest }: SegmentProps) {
  return (
    <HeroSegment.Root {...rest} {...omitUndefined({ size, isDisabled, "aria-label": label })} />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface SegmentParts {
  /** One choice, identified by its `id`. */
  readonly Item: typeof HeroSegment.Item;
  /** A divider between two items. */
  readonly Separator: typeof HeroSegment.Separator;
}

/** A segmented control: `Segment.Item` choices, with `Segment.Separator` between them. Name it with `label`. */
export const Segment: typeof SegmentRoot & SegmentParts = Object.assign(SegmentRoot, {
  Item: HeroSegment.Item,
  Separator: HeroSegment.Separator,
});
