/**
 * Stackra file contract:
 * Purpose: the native `Badge` compound on HeroUI Native Pro's Badge (a count, dot or label pinned to a corner of
 *          another view): the root maps `tone` to HeroUI's `color`; every other prop, `variant`, `size` and
 *          `placement` included, passes through. The parts Anchor, Background and Label are HeroUI Native Pro's own.
 * Boundary: no behaviour or styling of its own. HeroUI's `variant` here is the emphasis (`primary`, `secondary`,
 *          `soft`), not a colour, so it keeps its name. The compound exposes the parts of HeroUI Native Pro, its own
 *          components. HeroUI Native Pro's `useBadge` hook is re-exported.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { Badge as HeroBadge } from "heroui-native-pro/badge";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { BadgeProps } from "#native/badge/badge.props";

/** The root: HeroUI Native Pro's, with `tone` as its `color`. */
function BadgeRoot({ tone, ...rest }: BadgeProps): ReactElement {
  return <HeroBadge {...rest} {...omitUndefined({ color: tone })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface BadgeParts {
  /** The wrapper of the view the badge is pinned to. */
  readonly Anchor: typeof HeroBadge.Anchor;
  /** A custom background layer for the badge. */
  readonly Background: typeof HeroBadge.Background;
  /** The badge's text, such as a count. */
  readonly Label: typeof HeroBadge.Label;
}

/**
 * A badge pinned to a view: `Badge.Anchor` wraps the view and holds the badge, which holds a `Badge.Label`; leave the
 * label out for a dot.
 */
export const Badge: typeof BadgeRoot & BadgeParts = Object.assign(BadgeRoot, {
  Anchor: HeroBadge.Anchor,
  Background: HeroBadge.Background,
  Label: HeroBadge.Label,
});

export { useBadge } from "heroui-native-pro/badge";
