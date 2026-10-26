/**
 * Stackra file contract:
 * Purpose: the native `SplitView` compound on HeroUI Native Pro's SplitView (a top and a bottom section with a
 *          draggable divider): `SplitView.DragArea` names the divider from `label` as the accessibility label; the
 *          root and every other part (TopSection, DragHandle, BottomSection) are HeroUI Native Pro's own; the
 *          `useSplitView` hook comes with it. Snap points, `snapIndex` and the render-function children pass through.
 * Boundary: no behaviour or styling of its own. The root is a thin function so the compound never changes HeroUI
 *          Native Pro's own component. Imports the `split-view` subpath.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import { SplitView as HeroSplitView } from "heroui-native-pro/split-view";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SplitViewProps } from "#native/split-view/split-view.props";
import type { SplitViewDragAreaProps } from "#native/split-view/split-view-drag-area.props";

/** The root: HeroUI Native Pro's, which holds the snap points and the drag state. */
function SplitViewRoot(props: SplitViewProps): ReactElement {
  return <HeroSplitView {...props} />;
}

/** The pan region of the divider: HeroUI Native Pro's, named by `label`. */
function SplitViewDragArea({ label, ...rest }: SplitViewDragAreaProps): ReactElement {
  return <HeroSplitView.DragArea {...rest} {...omitUndefined({ accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface SplitViewParts {
  /** The top pane, whose height follows the divider. */
  readonly TopSection: typeof HeroSplitView.TopSection;
  /** The pan region around the handle, named by `label`. */
  readonly DragArea: typeof SplitViewDragArea;
  /** The visible pill of the divider. */
  readonly DragHandle: typeof HeroSplitView.DragHandle;
  /** The bottom pane, which fills the remaining space. */
  readonly BottomSection: typeof HeroSplitView.BottomSection;
}

/**
 * A vertical split with a draggable divider: `SplitView.TopSection`, `SplitView.DragArea` around a
 * `SplitView.DragHandle`, then `SplitView.BottomSection`. Name the divider for screen readers with `label`.
 */
export const SplitView: typeof SplitViewRoot & SplitViewParts = Object.assign(SplitViewRoot, {
  TopSection: HeroSplitView.TopSection,
  DragArea: SplitViewDragArea,
  DragHandle: HeroSplitView.DragHandle,
  BottomSection: HeroSplitView.BottomSection,
});

export { useSplitView } from "heroui-native-pro/split-view";
