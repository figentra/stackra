/**
 * Stackra file contract:
 * Purpose: the web `Badge` on HeroUI v3's Badge: maps the shared contract (`tone` to `color`, the logical corner to
 *          HeroUI's physical one from React Aria's direction, `label` to screen-reader text with the visible content
 *          hidden, or the whole badge hidden without it), lets presses through to the anchor, and passes every other
 *          HeroUI prop through unchanged.
 * Boundary: no styling of its own beyond `pointer-events-none`; the look is HeroUI's, themed by `@stackra/tokens`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0304; ADR 0060; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import { Badge as HeroBadge, cn } from "@heroui/react";
import { useLocale } from "react-aria-components";

import { physicalPlacementOf } from "#core/functions/physical-placement-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { BadgeProps } from "#react/badge/badge.props";
import type { BadgeAnchorProps } from "#react/badge/badge-anchor.props";

/** The badge itself; reached as `Badge`, with the anchor as `Badge.Anchor`. */
function BadgeRoot({
  tone,
  variant,
  size,
  placement = "top-end",
  label,
  children,
  className,
  ...rest
}: BadgeProps) {
  const { direction } = useLocale();
  // With a label the visible content is hidden and the label is read in its place; without one the badge is silent.
  const hidesContent = label ? true : undefined;
  return (
    <HeroBadge
      {...rest}
      {...omitUndefined({ color: tone, variant, size })}
      placement={physicalPlacementOf(placement, direction)}
      {...(label ? {} : { "aria-hidden": true })}
      // A badge overlaps its anchor's corner, so a press on it must reach the anchor.
      className={cn("pointer-events-none", className) ?? ""}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <HeroBadge.Label {...omitUndefined({ "aria-hidden": hidesContent })}>
          {children}
        </HeroBadge.Label>
      ) : children == null ? null : (
        <span {...omitUndefined({ "aria-hidden": hidesContent })} className="contents">
          {children}
        </span>
      )}
      {label ? <span className="sr-only">{label}</span> : null}
    </HeroBadge>
  );
}

/** The element a badge is pinned to: a relative box that shrinks to its content. */
function BadgeAnchor(props: BadgeAnchorProps) {
  return <HeroBadge.Anchor {...props} />;
}

/**
 * A count or dot pinned to a corner of another element. The corner is named by the reading direction, so
 * `top-end` is top right in English and top left in Arabic. Hidden from assistive technology unless it has a `label`.
 */
export const Badge = Object.assign(BadgeRoot, {
  /** The anchored element first, then the `Badge`, which is drawn on top of it. */
  Anchor: BadgeAnchor,
});
