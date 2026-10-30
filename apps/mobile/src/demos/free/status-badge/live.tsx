/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native StatusBadge: the badge changes on screen; nothing is announced.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Button, StatusBadge, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_BADGE_DEMO_KEYS } from "#src/demos/free/status-badge/status-badge-demo-keys.constant";

/** The demo's keys. */
const K = STATUS_BADGE_DEMO_KEYS.demo_free.status_badge;

/** A page that must announce a change uses a toast. */
export default function Live() {
  const [step, setStep] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  const tone = Enum.values(Tone)[step % Enum.values(Tone).length] ?? "default";
  return (
    <View className="flex-row items-center gap-3">
      <Button size="sm" variant="secondary" onPress={() => setStep((value) => value + 1)}>
        {t(K.advance)}
      </Button>
      <StatusBadge tone={tone}>{t(K.states[tone])}</StatusBadge>
    </View>
  );
}
