/**
 * Stackra file contract:
 * Purpose: the native `Reveal` on react-native-reanimated: its content fades in and rises 8pt into place when it
 *          mounts, with the theme's `reveal` step, one `stagger` step later for each `index`, as the web Reveal does.
 *          The system's reduce-motion setting shows the content at once (`ReduceMotion.System`), and so does
 *          `isAnimated` off.
 * Boundary: animates its own view's opacity and translation only. Liquid Glass breaks when an ancestor of a GlassView
 *          changes opacity, so a Reveal never wraps a glass surface: put it inside the glass, around the content
 *          (ADR 0329). The timing comes from `@stackra/tokens` (`motionTiming`).
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (decision 3); ADR 0303 (decision 7).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import Animated, { Easing, FadeInDown, ReduceMotion } from "react-native-reanimated";
import type { RevealProps } from "#native/reveal/reveal.props";

const REVEAL = motionTiming(STACKRA_THEME, "reveal");
const STAGGER = motionTiming(STACKRA_THEME, "stagger");

/** How far the content rises as it fades in, in points. */
const RISE = 8;

/** The entrance for a place in the row: the theme's reveal, waiting one stagger step per place. */
const enteringAt = (index: number) => {
  const entering = FadeInDown.duration(REVEAL.durationMs)
    .delay(Math.max(0, index) * STAGGER.durationMs)
    .withInitialValues({ opacity: 0, transform: [{ translateY: RISE }] })
    .reduceMotion(ReduceMotion.System);
  return REVEAL.bezier ? entering.easing(Easing.bezier(...REVEAL.bezier)) : entering;
};

/** Content that fades in and rises into place when it mounts. */
export function Reveal({ children, index = 0, isAnimated = true, ...rest }: RevealProps) {
  return (
    <Animated.View {...rest} {...(isAnimated ? { entering: enteringAt(index) } : {})}>
      {children}
    </Animated.View>
  );
}
