/**
 * Stackra file contract:
 * Purpose: the native `ProgressButton` compound on HeroUI Native Pro's ProgressButton (a press-and-hold button that
 *          fills an overlay to confirm an action): the root maps `label` to `accessibilityLabel` and `tone` to
 *          `variant`; every other prop, `holdDuration`, `onComplete` and the render-function children included,
 *          passes through.
 * Boundary: no behaviour or styling of its own; HeroUI Native Pro has no loading state, so there is no `isLoading`.
 *          The compound exposes the four parts of HeroUI Native Pro, its own components.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-008.
 */
import { ProgressButton as HeroProgressButton } from "heroui-native-pro/progress-button";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { ProgressButtonContractProps } from "#contracts/types/progress-button-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native ProgressButton: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label` and the colour scheme is `tone`, so HeroUI's names for them are left out.
 */
export type ProgressButtonProps = ProgressButtonContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroProgressButton>,
    keyof ProgressButtonContractProps | "variant" | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label and `tone` as its colour `variant`. */
function ProgressButtonRoot({
  label,
  isDisabled,
  tone,
  ...rest
}: ProgressButtonProps): ReactElement {
  return (
    <HeroProgressButton
      {...rest}
      {...omitUndefined({ isDisabled, variant: tone, accessibilityLabel: label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface ProgressButtonParts {
  /** The optional theme-aware background behind the button surface. */
  readonly Background: typeof HeroProgressButton.Background;
  /** The base text layer, always visible beneath the overlay. */
  readonly Label: typeof HeroProgressButton.Label;
  /** The layer that sweeps left to right while the button is held. */
  readonly Overlay: typeof HeroProgressButton.Overlay;
  /** The inverted-colour text inside the overlay, aligned with the base label. */
  readonly MaskLabel: typeof HeroProgressButton.MaskLabel;
}

/**
 * A press-and-hold button: the user holds it for `holdDuration` and the overlay fills to confirm the action. A string
 * child renders the label, overlay and mask label itself; pass `ProgressButton.Label`, `ProgressButton.Overlay` and
 * `ProgressButton.MaskLabel` for full control. Name it for screen readers with `label`.
 */
export const ProgressButton: typeof ProgressButtonRoot & ProgressButtonParts = Object.assign(
  ProgressButtonRoot,
  {
    Background: HeroProgressButton.Background,
    Label: HeroProgressButton.Label,
    Overlay: HeroProgressButton.Overlay,
    MaskLabel: HeroProgressButton.MaskLabel,
  },
);
