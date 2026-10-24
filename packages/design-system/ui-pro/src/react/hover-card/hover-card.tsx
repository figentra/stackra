/**
 * Stackra file contract:
 * Purpose: the web `HoverCard` compound on HeroUI Pro's HoverCard: the root maps `isOpen` to HeroUI Pro's `open`,
 *          `HoverCard.Content` names its card from `label`, and Trigger and Arrow are HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `HoverCard.Root` is left out. Imports the `hover-card` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import {
  HoverCard as HeroHoverCard,
  type HoverCardContentProps as HeroHoverCardContentProps,
  type HoverCardProps as HeroHoverCardProps,
} from "@heroui-pro/react/hover-card";

import type {
  HoverCardContentContractProps,
  HoverCardContractProps,
} from "#contracts/types/hover-card-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web HoverCard: the shared contract plus HeroUI Pro's own, with `open` renamed `isOpen`. */
export type HoverCardProps = HoverCardContractProps &
  Omit<HeroHoverCardProps, keyof HoverCardContractProps | "open">;

/** The root: HeroUI Pro's, which holds the open state and the delays shared by the trigger and the card. */
function HoverCardRoot({ isOpen, ...rest }: HoverCardProps) {
  return <HeroHoverCard.Root {...rest} {...omitUndefined({ open: isOpen })} />;
}

/** Props of `HoverCard.Content`: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type HoverCardContentProps = HoverCardContentContractProps &
  Omit<HeroHoverCardContentProps, keyof HoverCardContentContractProps | "aria-label">;

/** The card: HeroUI Pro's popover, a dialog named by `label`. */
function HoverCardContent({ label, ...rest }: HoverCardContentProps) {
  return <HeroHoverCard.Content {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface HoverCardParts {
  /** The element that opens the card on hover or focus. */
  readonly Trigger: typeof HeroHoverCard.Trigger;
  /** The card that opens, named by `label`. */
  readonly Content: typeof HoverCardContent;
  /** The arrow that points the card at its trigger. */
  readonly Arrow: typeof HeroHoverCard.Arrow;
}

/** A card that opens when its trigger is hovered or focused: `HoverCard.Trigger`, then `HoverCard.Content`. */
export const HoverCard: typeof HoverCardRoot & HoverCardParts = Object.assign(HoverCardRoot, {
  Trigger: HeroHoverCard.Trigger,
  Content: HoverCardContent,
  Arrow: HeroHoverCard.Arrow,
});
