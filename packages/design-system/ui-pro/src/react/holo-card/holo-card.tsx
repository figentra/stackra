/**
 * Stackra file contract:
 * Purpose: the web `HoloCard` compound on HeroUI Pro's HoloCard: the tilting card root and the parts Rotator, Frame,
 *          Surface, Image, Inset, Pattern, Content, Shine and ShinePattern, with HeroUI Pro's own part names.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. `isDisabled` and
 *          `isInteractive` are HeroUI Pro's and already follow the vocabulary. The compound exposes the documented
 *          parts: HeroUI Pro's `HoloCard.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { HoloCard as HeroHoloCard } from "@heroui-pro/react/holo-card";

import type { HoloCardProps } from "#react/holo-card/holo-card.props";

/** The card root: HeroUI Pro's, which tracks the pointer and sets the tilt and light. */
function HoloCardRoot(props: HoloCardProps) {
  return <HeroHoloCard.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface HoloCardParts {
  /** The layer that rotates with the pointer. */
  readonly Rotator: typeof HeroHoloCard.Rotator;
  /** The card's outer frame. */
  readonly Frame: typeof HeroHoloCard.Frame;
  /** The card's surface, which the gradient and textures sit on. */
  readonly Surface: typeof HeroHoloCard.Surface;
  /** The card's art, which needs `alt` text (empty when decorative). */
  readonly Image: typeof HeroHoloCard.Image;
  /** An inset panel inside the frame. */
  readonly Inset: typeof HeroHoloCard.Inset;
  /** The static texture overlay. */
  readonly Pattern: typeof HeroHoloCard.Pattern;
  /** A content layer, drifting against the tilt unless `parallax` is off. */
  readonly Content: typeof HeroHoloCard.Content;
  /** The holographic glare overlay. */
  readonly Shine: typeof HeroHoloCard.Shine;
  /** The texture drawn inside the glare. */
  readonly ShinePattern: typeof HeroHoloCard.ShinePattern;
}

/** A card that tilts and lights up under the pointer: `HoloCard.Rotator`, `Frame`, `Surface` and the layers inside. */
export const HoloCard: typeof HoloCardRoot & HoloCardParts = Object.assign(HoloCardRoot, {
  Rotator: HeroHoloCard.Rotator,
  Frame: HeroHoloCard.Frame,
  Surface: HeroHoloCard.Surface,
  Image: HeroHoloCard.Image,
  Inset: HeroHoloCard.Inset,
  Pattern: HeroHoloCard.Pattern,
  Content: HeroHoloCard.Content,
  Shine: HeroHoloCard.Shine,
  ShinePattern: HeroHoloCard.ShinePattern,
});
