/**
 * Stackra file contract:
 * Purpose: the native `SlideButton` compound on HeroUI Native Pro's SlideButton (a slide-to-confirm control): the
 *          root maps `label` to `accessibilityLabel` and `tone` to `variant`; every other prop,
 *          `completionThreshold`, `onComplete` and the render-function children included, passes through.
 * Boundary: no behaviour or styling of its own; HeroUI Native Pro has no loading state, so there is no `isLoading`.
 *          The compound exposes the six parts of HeroUI Native Pro, its own components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-009.
 */
import { SlideButton as HeroSlideButton } from "heroui-native-pro/slide-button";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { SlideButtonContractProps } from "#contracts/types/slide-button-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native SlideButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label` and the colour scheme is `tone`, so HeroUI's names for them are left out.
 */
export type SlideButtonProps = SlideButtonContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSlideButton>,
    keyof SlideButtonContractProps | "variant" | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label and `tone` as its colour `variant`. */
function SlideButtonRoot({ label, isDisabled, tone, ...rest }: SlideButtonProps): ReactElement {
  return (
    <HeroSlideButton
      {...rest}
      {...omitUndefined({ isDisabled, variant: tone, accessibilityLabel: label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface SlideButtonParts {
  /** The static content beneath the overlay: a label, a gradient or a pattern. */
  readonly UnderlayContent: typeof HeroSlideButton.UnderlayContent;
  /** The progress fill layer, clipped to the thumb's position. */
  readonly OverlayContent: typeof HeroSlideButton.OverlayContent;
  /** The draggable handle that drives the slide gesture. */
  readonly Thumb: typeof HeroSlideButton.Thumb;
  /** The optional theme-aware background behind the thumb surface. */
  readonly ThumbBackground: typeof HeroSlideButton.ThumbBackground;
  /** The optional theme-aware background behind the container surface. */
  readonly ContainerBackground: typeof HeroSlideButton.ContainerBackground;
  /** The styled text that inherits the variant colour. */
  readonly Label: typeof HeroSlideButton.Label;
}

/**
 * A slide-to-confirm control: the user drags `SlideButton.Thumb` past the completion threshold to confirm the
 * action. Put the text in `SlideButton.UnderlayContent` and `SlideButton.OverlayContent`. Name it for screen readers
 * with `label`.
 */
export const SlideButton: typeof SlideButtonRoot & SlideButtonParts = Object.assign(
  SlideButtonRoot,
  {
    UnderlayContent: HeroSlideButton.UnderlayContent,
    OverlayContent: HeroSlideButton.OverlayContent,
    Thumb: HeroSlideButton.Thumb,
    ThumbBackground: HeroSlideButton.ThumbBackground,
    ContainerBackground: HeroSlideButton.ContainerBackground,
    Label: HeroSlideButton.Label,
  },
);
