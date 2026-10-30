/**
 * Stackra file contract:
 * Purpose: the native `TextReveal`: a headline whose words rise and fade in one after another (60 ms apart), for a
 *          hero, drawn as a wrapping row of `Text` words in the heading type.
 * Boundary: the row is one accessible element whose label is the whole text (role `header`), so VoiceOver and TalkBack
 *           read it once. Words are split on spaces only (`revealWordsOf`), never inside a word, so Arabic stays joined
 *           and shaped by the platform's text engine; the row follows the layout direction, and a text that mixes
 *           Arabic with Latin is one piece, so its bidi order holds. Reanimated's entrance runs on the UI thread; at the
 *           `reduced` level the provider's `ReducedMotionConfig` skips it, and at `none` or with `isAnimated` false the
 *           text is a plain heading.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); ADR 0060 (right-to-left); WCAG 2.2 SC 2.3.3.
 */
import type { ReactElement } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { revealWordsOf } from "#core/functions/reveal-words-of.function";
import { useMotion } from "#native/design-system-provider/use-motion";
import { Text } from "#native/text/text";
import type { TextRevealProps } from "#native/text-reveal/text-reveal.props";

/** The wait between two words, in milliseconds. */
const STAGGER = 60;

/** The headline type: the size and weight a hero title takes. */
const HEADLINE = "text-3xl font-semibold";

/** A headline whose words fade in one after another. */
export function TextReveal({
  children,
  delay = 0,
  isAnimated = true,
}: TextRevealProps): ReactElement {
  const level = useMotion();
  if (!isAnimated || level === "none")
    return (
      <Text className={HEADLINE} accessibilityRole="header">
        {children}
      </Text>
    );
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={children}
      className="flex-row flex-wrap gap-x-2"
    >
      {revealWordsOf(children).map((word, index) => (
        <Animated.View
          // The words of one string never reorder, so the index is a stable key.
          // oxlint-disable-next-line react/no-array-index-key -- a repeated word has no other identity
          key={index}
          entering={FadeInDown.delay(delay + index * STAGGER).duration(500)}
        >
          <Text className={HEADLINE}>{word}</Text>
        </Animated.View>
      ))}
    </View>
  );
}
