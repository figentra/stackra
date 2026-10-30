/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Slide to confirm: charge a sale and close a shift, each with a way to start again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, SlideToConfirm, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SLIDE_TO_CONFIRM_DEMO_KEYS } from "#src/demos/free/slide-to-confirm/slide-to-confirm-demo-keys.constant";

/** The demo's keys. */
const K = SLIDE_TO_CONFIRM_DEMO_KEYS.demo_free.slide_to_confirm.sample;

/** Slide to confirm: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [round, setRound] = useState(0);
  return (
    <View className="gap-3">
      <SlideToConfirm key={`charge-${round}`} label={t(K.charge)} confirmedLabel={t(K.charged)} />
      <SlideToConfirm
        key={`close-${round}`}
        variant="danger"
        label={t(K.close)}
        confirmedLabel={t(K.closed)}
      />
      <Button variant="ghost" startIcon="rotate-ccw" onPress={() => setRound((value) => value + 1)}>
        {t(K.reset)}
      </Button>
    </View>
  );
}
