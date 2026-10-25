/**
 * Stackra file contract:
 * Purpose: the web `Reveal` on Motion: its content fades in and rises 8px into place when it mounts, with the theme's
 *          `reveal` step (400ms, an ease that settles slowly), one `stagger` step later for each `index`. Under reduced
 *          motion, or with `isAnimated` off, the content shows at once.
 * Boundary: animates opacity and a vertical transform of its own `div` only, never a blur and never a parent, so it
 *          never wraps a glass surface: put it inside the glass, around the content (ADR 0329). The timing comes from
 *          `@stackra/tokens` (`motionTiming`); a product theme changes the accent and mark only, so every product moves
 *          alike. Needs the `motion` peer.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (decision 3); ADR 0303 (decision 7).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

import type { RevealContractProps } from "#contracts/types/reveal-contract-props.type";

const REVEAL = motionTiming(STACKRA_THEME, "reveal");
const STAGGER = motionTiming(STACKRA_THEME, "stagger");

/** How far the content rises as it fades in, in px. */
const RISE = 8;

/**
 * Props of the web Reveal: the shared contract plus Motion's `div` props, passed through. The motion itself
 * (`initial`, `animate`, `transition`) is the theme's, so those are refused.
 */
export type RevealProps = RevealContractProps &
  Omit<
    HTMLMotionProps<"div">,
    keyof RevealContractProps | "initial" | "animate" | "transition" | "exit"
  >;

/** Content that fades in and rises into place when it mounts. */
export function Reveal({ children, index = 0, isAnimated = true, ...rest }: RevealProps) {
  const isReduced = useReducedMotion() ?? false;
  const plays = isAnimated && !isReduced;
  return (
    <motion.div
      {...rest}
      data-slot="reveal"
      initial={plays ? { opacity: 0, y: RISE } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: REVEAL.durationMs / 1000,
        ease: REVEAL.bezier ?? "easeOut",
        delay: (Math.max(0, index) * STAGGER.durationMs) / 1000,
      }}
    >
      {children}
    </motion.div>
  );
}
