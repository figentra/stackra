/**
 * Stackra file contract:
 * Purpose: the native `MorphButton` compound on HeroUI Native Pro's MorphButton (a button that morphs into a larger
 *          surface): the root maps `label` to `accessibilityLabel`; every other prop, `direction`, `variant`,
 *          `isOpen`, `defaultOpen` and `onOpenChange` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the two parts of HeroUI Native Pro, its own
 *          components. HeroUI Native Pro's `useMorphButton` hook stays in `heroui-native-pro/morph-button`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */
import { MorphButton as HeroMorphButton } from "heroui-native-pro/morph-button";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { MorphButtonProps } from "#native/morph-button/morph-button.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function MorphButtonRoot({ label, isDisabled, ...rest }: MorphButtonProps): ReactElement {
  return (
    <HeroMorphButton {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface MorphButtonParts {
  /** The content shown while the button is collapsed. */
  readonly CollapsedContent: typeof HeroMorphButton.CollapsedContent;
  /** The content shown once the button has morphed open. */
  readonly ExpandedContent: typeof HeroMorphButton.ExpandedContent;
}

/**
 * A button that morphs into a larger surface: `MorphButton.CollapsedContent` shows while it is closed and
 * `MorphButton.ExpandedContent` once it is open. Name it for screen readers with `label`.
 */
export const MorphButton: typeof MorphButtonRoot & MorphButtonParts = Object.assign(
  MorphButtonRoot,
  {
    CollapsedContent: HeroMorphButton.CollapsedContent,
    ExpandedContent: HeroMorphButton.ExpandedContent,
  },
);
