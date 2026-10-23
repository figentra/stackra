/**
 * Stackra file contract:
 * Purpose: the native `SwipeableRow` compound on HeroUI Native Pro's SwipeableRow (a row that swipes to reveal
 *          action rails): the root maps `label` to `accessibilityLabel`; every other prop, the layout `variant`,
 *          `openSide`, the threshold props and the imperative `ref` (`open`, `close`, `reset`) included, passes
 *          through. `Action` maps `tone` to HeroUI's colour `variant`.
 * Boundary: no behaviour or styling of its own. The compound exposes four parts of HeroUI Native Pro as its own
 *          components, and `Action` as a thin wrapper over its `Action`. HeroUI Native Pro's own `useSwipeableRow` hook stays in `heroui-native-pro/swipeable-row`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-010.
 */
import { SwipeableRow as HeroSwipeableRow } from "heroui-native-pro/swipeable-row";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type {
  SwipeableRowActionContractProps,
  SwipeableRowContractProps,
} from "#contracts/types/swipeable-row-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native SwipeableRow: the shared contract plus HeroUI Native Pro's own props, passed through
 * unchanged. The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type SwipeableRowProps = SwipeableRowContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSwipeableRow>,
    keyof SwipeableRowContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label; its `ref` passes through. */
function SwipeableRowRoot({ label, isDisabled, ...rest }: SwipeableRowProps): ReactElement {
  return (
    <HeroSwipeableRow {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />
  );
}

/**
 * Props of `SwipeableRow.Action`: the shared contract plus HeroUI Native Pro's own action props, passed through
 * unchanged. The colour scheme is `tone`, so HeroUI's `variant` is left out of the type.
 */
export type SwipeableRowActionProps = SwipeableRowActionContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroSwipeableRow.Action>,
    keyof SwipeableRowActionContractProps | "variant"
  >;

/** The action: HeroUI Native Pro's, with `tone` as its colour `variant`. */
function SwipeableRowAction({ tone, ...rest }: SwipeableRowActionProps): ReactElement {
  return <HeroSwipeableRow.Action {...rest} {...omitUndefined({ variant: tone })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface SwipeableRowParts {
  /** An action rail anchored to the `start` or `end` edge. */
  readonly Actions: typeof HeroSwipeableRow.Actions;
  /** The draggable row card. */
  readonly Content: typeof HeroSwipeableRow.Content;
  /** The optional theme-aware background layer behind the content card. */
  readonly ContentBackground: typeof HeroSwipeableRow.ContentBackground;
  /** A pressable action inside an action rail, coloured by `tone`. */
  readonly Action: typeof SwipeableRowAction;
  /** The styled action text that inherits the action's variant. */
  readonly ActionLabel: typeof HeroSwipeableRow.ActionLabel;
}

/**
 * A row that swipes to reveal actions on its start and end edges: `SwipeableRow.Content` is the card and
 * `SwipeableRow.Actions` holds `SwipeableRow.Action` buttons. Name the row for screen readers with `label`.
 */
export const SwipeableRow: typeof SwipeableRowRoot & SwipeableRowParts = Object.assign(
  SwipeableRowRoot,
  {
    Actions: HeroSwipeableRow.Actions,
    Content: HeroSwipeableRow.Content,
    ContentBackground: HeroSwipeableRow.ContentBackground,
    Action: SwipeableRowAction,
    ActionLabel: HeroSwipeableRow.ActionLabel,
  },
);
