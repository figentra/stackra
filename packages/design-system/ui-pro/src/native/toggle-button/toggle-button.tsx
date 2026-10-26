/**
 * Stackra file contract:
 * Purpose: the native `ToggleButton` compound on HeroUI Native Pro's ToggleButton (a button with a selected state):
 *          the root maps `label` to `accessibilityLabel`, and takes `size` and `isDisabled`; every other prop,
 *          `isSelected`, `defaultSelected`, `onChange` and `variant` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the one part of HeroUI Native Pro, its own
 *          component. HeroUI Native Pro's `useToggleButton` hook stays in `heroui-native-pro/toggle-button`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import { ToggleButton as HeroToggleButton } from "heroui-native-pro/toggle-button";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ToggleButtonProps } from "#native/toggle-button/toggle-button.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function ToggleButtonRoot({ label, size, isDisabled, ...rest }: ToggleButtonProps): ReactElement {
  return (
    <HeroToggleButton
      {...rest}
      {...omitUndefined({ size, isDisabled, accessibilityLabel: label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface ToggleButtonParts {
  /** The text of the button, coloured by the selected state. */
  readonly Label: typeof HeroToggleButton.Label;
}

/**
 * A button that toggles between selected and unselected: put the text in `ToggleButton.Label`, and control it with
 * `isSelected` and `onChange`. Name it for screen readers with `label`.
 */
export const ToggleButton: typeof ToggleButtonRoot & ToggleButtonParts = Object.assign(
  ToggleButtonRoot,
  { Label: HeroToggleButton.Label },
);
