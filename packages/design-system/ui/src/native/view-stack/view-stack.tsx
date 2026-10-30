/**
 * Stackra file contract:
 * Purpose: the native `ViewStack`: a drill-down inside one region of a screen. Its `ViewStack.View`s are shown one at
 *          a time, the top of a stack that `useViewStack().push(id)` grows and `pop()` (or `ViewStack.Back`) shrinks,
 *          moving with the shared transition vocabulary (`push`, `push-parallax`, `from-top`, `fade`, `none`) on
 *          Reanimated's layout animations, on the UI thread. A push comes from the reading end, the left in
 *          right-to-left, and going back mirrors it.
 * Boundary: for a drill-down between screens, the app's native-stack navigator plays the same vocabulary through
 *           `nativeStackAnimationOf`. `push-parallax` fades the old view out as it slides, an approximation of the
 *           web's drift (Reanimated has no partial slide preset). At the `reduced` level every move is a fade, which
 *           the provider's `ReducedMotionConfig` then stills; at `none` nothing plays.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060 (right-to-left); WCAG 2.2 SC 2.3.3.
 */
import { type ReactElement, use, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  SlideOutLeft,
  SlideOutRight,
  SlideOutUp,
} from "react-native-reanimated";

import type { Direction } from "#contracts/enums/direction.enum";
import type { MotionLevel } from "#contracts/enums/motion-level.enum";
import type { ViewStackTransition } from "#contracts/enums/view-stack-transition.enum";
import type { ViewStackState } from "#contracts/types/view-stack-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { useMotion } from "#native/design-system-provider/use-motion";
import { ViewStackBack } from "#native/view-stack/view-stack-back";
import { ViewStackContext } from "#native/view-stack/view-stack-context";
import { ViewStackView } from "#native/view-stack/view-stack-view";
import type { ViewStackProps } from "#native/view-stack/view-stack.props";

/** How long a move takes, in milliseconds, as on web. */
const DURATION = 380;

/** The entrance of the new top view and the exit of the old one, or none. */
function layoutAnimationOf(
  transition: ViewStackTransition,
  way: "forward" | "back",
  direction: Direction,
  motion: MotionLevel,
) {
  if (motion === "none" || transition === "none") return {};
  if (motion === "reduced" || transition === "fade")
    return { entering: FadeIn.duration(200), exiting: FadeOut.duration(200) };
  if (transition === "from-top")
    return way === "forward"
      ? { entering: SlideInUp.duration(DURATION), exiting: FadeOut.duration(DURATION) }
      : { entering: FadeIn.duration(DURATION), exiting: SlideOutUp.duration(DURATION) };
  // Forward comes in from the reading end: the right in left-to-right.
  const fromEnd = (way === "forward") === (direction === "ltr");
  const entering = (fromEnd ? SlideInRight : SlideInLeft).duration(DURATION);
  const exiting =
    transition === "push-parallax"
      ? FadeOut.duration(DURATION)
      : (fromEnd ? SlideOutLeft : SlideOutRight).duration(DURATION);
  return { entering, exiting };
}

/** The view stack root: holds the stack and plays each move. */
// oxlint-disable-next-line react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the root function, which React Refresh takes as a component (rule-gap B-6)
function ViewStackRoot({
  children,
  defaultView,
  transition = "push",
  onViewChange,
}: ViewStackProps): ReactElement {
  const [stack, setStack] = useState<readonly string[]>([defaultView]);
  const [way, setWay] = useState<"forward" | "back" | undefined>(undefined);
  const motion = useMotion();
  const direction = use(DesignSystemContext)?.direction ?? "ltr";
  const current = stack.at(-1) ?? defaultView;
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    onViewChange?.(current);
    // Called once per move, with the view the move ended on.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reports moves only, not a new callback identity
  }, [current]);

  const state = useMemo<ViewStackState>(
    () => ({
      stack,
      current,
      canGoBack: stack.length > 1,
      push: (view) => {
        setWay("forward");
        setStack([...stack, view]);
      },
      pop: () => {
        if (stack.length < 2) return;
        setWay("back");
        setStack(stack.slice(0, -1));
      },
    }),
    [stack, current],
  );
  const value = useMemo(() => ({ state, hasMoved: way !== undefined }), [state, way]);
  const animation = way === undefined ? {} : layoutAnimationOf(transition, way, direction, motion);
  return (
    <ViewStackContext value={value}>
      <View className="overflow-hidden">
        {/* Keyed by the top view, so a move unmounts the old one (its exit) and mounts the new one (its entrance). */}
        <Animated.View key={`${current}-${stack.length}`} {...animation}>
          {children}
        </Animated.View>
      </View>
    </ViewStackContext>
  );
}

/** The parts of the compound. */
interface ViewStackParts {
  /** One view, drawn while it is on top. */
  readonly View: typeof ViewStackView;
  /** The button that goes back one view, drawn when there is one. */
  readonly Back: typeof ViewStackBack;
}

/**
 * A drill-down inside one region: `ViewStack.View`s shown one at a time, moved between with `useViewStack()` and
 * `ViewStack.Back`, with one transition vocabulary on web and native.
 */
export const ViewStack: typeof ViewStackRoot & ViewStackParts = Object.assign(ViewStackRoot, {
  View: ViewStackView,
  Back: ViewStackBack,
});
