/**
 * Stackra file contract:
 * Purpose: the web `TextReveal`: a headline whose words rise and fade in one after another (60 ms apart), for a hero.
 *          Put it inside the heading element, which keeps the outline and the type style.
 * Boundary: the animated words are hidden from assistive technology and the whole text is read once from a visually
 *           hidden copy. Words are split on spaces only (`revealWordsOf`), never inside a word, and a text that mixes
 *           Arabic with Latin is revealed as one piece, so its bidi order holds. At the `reduced` motion level Motion's
 *           `MotionConfig` drops the rise and keeps the fade; at `none`, or with `isAnimated` false, the text is plain.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060 (right-to-left); WCAG 2.2 SC 2.3.3.
 */
import { motion } from "motion/react";
import type { ReactElement } from "react";

import { revealWordsOf } from "#core/functions/reveal-words-of.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import type { TextRevealProps } from "#react/text-reveal/text-reveal.props";

/** The wait between two words, in seconds. */
const STAGGER = 0.06;

/** A headline whose words fade in one after another. */
export function TextReveal({
  children,
  delay = 0,
  isAnimated = true,
}: TextRevealProps): ReactElement {
  const level = useMotion();
  if (!isAnimated || level === "none") return <>{children}</>;
  return (
    <>
      <span aria-hidden="true">
        {revealWordsOf(children).map((word, index) => (
          <motion.span
            // The words of one string never reorder, so the index is a stable key.
            // oxlint-disable-next-line react/no-array-index-key -- a repeated word has no other identity
            key={index}
            className="inline-block whitespace-pre"
            initial={{ opacity: 0, y: "0.35em", filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: delay / 1000 + index * STAGGER,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {index === 0 ? word : ` ${word}`}
          </motion.span>
        ))}
      </span>
      <span className="sr-only">{children}</span>
    </>
  );
}
