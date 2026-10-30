/**
 * Stackra file contract:
 * Purpose: the "directional-motion" demo of the native Bidi: checkout steps that slide in from the inline end going
 *          forward and from the start going back, the side read from `useDirection`, so Arabic mirrors it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The slide is Reanimated's and follows the system's reduced motion.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Button, Card, Text, useCatalogueText, useDirection } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";
import Animated, { ReduceMotion, SlideInLeft, SlideInRight } from "react-native-reanimated";

import { MESSAGES } from "#src/constants/messages.constant";
import { BIDI_DEMO_KEYS } from "#src/demos/free/bidi/bidi-demo-keys.constant";

/** The demo's keys. */
const K = BIDI_DEMO_KEYS.demo_free.bidi.directional_motion;

/** The checkout steps, in order. */
const STEPS = [K.cart, K.payment, K.receipt] as const;

/** Next and Back slide the step in from the side the reading direction says. */
export default function DirectionalMotion() {
  const t = useCatalogueText(MESSAGES.en);
  const isRtl = useDirection() === "rtl";
  const [step, setStep] = useState(0);
  const [isForward, setIsForward] = useState(true);
  // Forward comes from the inline end: the right in English, the left in Arabic.
  const fromRight = isForward !== isRtl;
  const entering = (fromRight ? SlideInRight : SlideInLeft).reduceMotion(ReduceMotion.System);
  const go = (next: number) => {
    setIsForward(next > step);
    setStep(next);
  };
  return (
    <View className="gap-3">
      <View className="overflow-hidden">
        <Animated.View key={step} entering={entering}>
          <Card>
            <Card.Content>
              <Text>{t(STEPS[step] ?? K.cart)}</Text>
            </Card.Content>
          </Card>
        </Animated.View>
      </View>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.step_of, { step: step + 1, total: STEPS.length })}
      </Text>
      <View className="flex-row gap-2">
        <Button size="sm" variant="secondary" isDisabled={step === 0} onPress={() => go(step - 1)}>
          {t(K.back)}
        </Button>
        <Button size="sm" isDisabled={step === STEPS.length - 1} onPress={() => go(step + 1)}>
          {t(K.next)}
        </Button>
      </View>
    </View>
  );
}
