/**
 * Stackra file contract:
 * Purpose: the native `FlipCard` compound on HeroUI Native Pro's FlipCard (a pressable card that turns over to show
 *          a back face): the root maps `label` to `accessibilityLabel`; every other prop, `direction`, `rotation`,
 *          `isFlipped`, `defaultFlipped`, `isPressDisabled` and `onFlipChange` included, passes through. The parts
 *          Front, Back and FaceBackground are HeroUI Native Pro's own.
 * Boundary: no behaviour or styling of its own. The compound exposes the parts of HeroUI Native Pro, its own
 *          components. HeroUI Native Pro's `useFlipCard` and `useFlipCardAnimation` hooks are re-exported.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { FlipCard as HeroFlipCard } from "heroui-native-pro/flip-card";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { FlipCardContractProps } from "#contracts/types/flip-card-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native FlipCard: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type FlipCardProps = FlipCardContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroFlipCard>,
    keyof FlipCardContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function FlipCardRoot({ label, ...rest }: FlipCardProps): ReactElement {
  return <HeroFlipCard {...rest} {...omitUndefined({ accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface FlipCardParts {
  /** The face visible at rest. */
  readonly Front: typeof HeroFlipCard.Front;
  /** The face shown once the card is flipped. */
  readonly Back: typeof HeroFlipCard.Back;
  /** A background layer shared by both faces. */
  readonly FaceBackground: typeof HeroFlipCard.FaceBackground;
}

/** A card that flips on press: `FlipCard.Front` and `FlipCard.Back`. Name it for screen readers with `label`. */
export const FlipCard: typeof FlipCardRoot & FlipCardParts = Object.assign(FlipCardRoot, {
  Front: HeroFlipCard.Front,
  Back: HeroFlipCard.Back,
  FaceBackground: HeroFlipCard.FaceBackground,
});

export { useFlipCard, useFlipCardAnimation } from "heroui-native-pro/flip-card";
