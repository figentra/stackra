/**
 * Stackra file contract:
 * Purpose: `ButtonGroupContractProps`, the props every runtime's `ButtonGroup` takes: related buttons attached into
 *          one control, sharing a size, a variant and the disabled state, named as a group.
 * Boundary: types only; the buttons are the caller's `Button`s. For one action with a menu of others use SplitButton.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { ReactNode } from "react";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web and native `ButtonGroup`. */
export interface ButtonGroupContractProps {
  /** The buttons, in reading order. */
  readonly children: ReactNode;
  /** The group's spoken name, for example "Text alignment". */
  readonly label: string;
  /** `horizontal` (the default) or `vertical`. */
  readonly orientation?: Orientation | undefined;
  /** The size every button takes. */
  readonly size?: Size | undefined;
  /** The variant every button takes. Defaults to `secondary`. */
  readonly variant?: ButtonVariant | undefined;
  /** True to disable every button. */
  readonly isDisabled?: boolean | undefined;
}
