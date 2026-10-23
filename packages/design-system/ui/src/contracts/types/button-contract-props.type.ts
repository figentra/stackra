/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Button` takes: variant, size, the disabled, loading and full-width states,
 *          the start and end icons, the accessible label override and the press handler. Each runtime's
 *          `ButtonProps` is this plus its HeroUI button's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0165 (UI
 *          contract).
 */
import type { ReactNode } from "react";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native `Button`. */
export interface ButtonContractProps {
  /** The visible label, usually a string; it is also the accessible name unless `label` is given. */
  readonly children?: ReactNode;
  /** The emphasis and colour of the button. Defaults to `primary`. */
  readonly variant?: ButtonVariant | undefined;
  /** The height, padding and text size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to refuse presses and show the disabled style; the button leaves the tab order on web. */
  readonly isDisabled?: boolean | undefined;
  /** True while the action runs: presses are refused, a spinner replaces the start icon, focus stays. */
  readonly isLoading?: boolean | undefined;
  /** True to stretch the button to the full width of its container. */
  readonly isFullWidth?: boolean | undefined;
  /** An element drawn before the label, on the inline-start side: an icon name or any icon element. */
  readonly startIcon?: IconSlot;
  /** An element drawn after the label, on the inline-end side: an icon name or any icon element. */
  readonly endIcon?: IconSlot;
  /** The accessible name when it must differ from the visible label. */
  readonly label?: string | undefined;
  /** Called when the button is pressed, by pointer, touch or keyboard. */
  readonly onPress?: (() => void) | undefined;
}
