/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SplitButton` takes: the primary action (its label, icon and press handler) joined
 *          to a caret button that opens a menu of related actions ("Save" with "Save and new"), the caret's accessible
 *          name, the shared variant, size, disabled and loading states, and the menu's open state and placement. Each
 *          runtime's `SplitButtonProps` is this plus its button group root's own props, which pass through unchanged.
 * Boundary: types only. No selection: the menu holds actions, as in `ActionMenu`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0312; design-system
 *          gap inventory row 34 (2026-10-28).
 */
import type { ReactNode } from "react";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `SplitButton`. The open state is the caret menu's. */
export interface SplitButtonContractProps extends OpenStateContractProps, PlacementContractProps {
  /** The primary action's visible label, which is also its accessible name. */
  readonly children: ReactNode;
  /** Called when the primary action is pressed. */
  readonly onPress?: (() => void) | undefined;
  /** An icon drawn before the primary label, on the inline-start side. */
  readonly startIcon?: IconSlot | undefined;
  /** The accessible name of the caret button, for example "More save options". */
  readonly menuLabel: string;
  /** The related actions the caret opens, in groups. */
  readonly sections: readonly MenuSection[];
  /** Called with the key of every menu action chosen, after the action's own `onPress`. */
  readonly onAction?: ((id: string) => void) | undefined;
  /** The emphasis of both halves. Defaults to `primary`. */
  readonly variant?: ButtonVariant | undefined;
  /** The size of both halves. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to refuse both halves. */
  readonly isDisabled?: boolean | undefined;
  /** True while the primary action runs: the primary half shows a spinner and the caret is refused. */
  readonly isLoading?: boolean | undefined;
}
