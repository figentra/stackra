/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Morph button: a payment that spins, then succeeds or asks to try again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MorphButtonState } from "@stackra/ui/contracts";
import { MorphButton, Switch, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MORPH_BUTTON_DEMO_KEYS } from "#src/demos/free/morph-button/morph-button-demo-keys.constant";

/** The demo's keys. */
const K = MORPH_BUTTON_DEMO_KEYS.demo_free.morph_button.sample;

/** Morph button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [state, setState] = useState<MorphButtonState>("idle");
  const [willFail, setWillFail] = useState(false);
  // The payment answers after 1.2 s; the button settles back to its label by itself after success.
  useEffect(() => {
    if (state !== "loading") return undefined;
    const timer = setTimeout(() => setState(willFail ? "error" : "success"), 1200);
    return () => clearTimeout(timer);
  }, [state, willFail]);
  return (
    <View className="items-start gap-4">
      <MorphButton
        state={state}
        labels={{ idle: t(K.pay), loading: t(K.paying), success: t(K.paid), error: t(K.failed) }}
        onPress={() => setState("loading")}
        onSuccessEnd={() => setState("idle")}
      />
      <Switch label={t(K.fail_next)} value={willFail} onChange={setWillFail} />
    </View>
  );
}
