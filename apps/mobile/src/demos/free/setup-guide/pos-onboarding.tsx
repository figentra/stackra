/**
 * Stackra file contract:
 * Purpose: the "pos-onboarding" demo of the native SetupGuide: a new terminal's checklist with read-only boxes the system ticks itself.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, SetupGuide, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SETUP_GUIDE_DEMO_KEYS } from "#src/demos/free/setup-guide/setup-guide-demo-keys.constant";

/** The demo's keys. */
const K = SETUP_GUIDE_DEMO_KEYS.demo_free.setup_guide;

/** The terminal's tasks, in the order the system completes them. */
const STEPS = ["printer", "staff", "shift"] as const;

/** The SetupGuide demo: a point of sale terminal's onboarding. */
export default function PosOnboarding() {
  const t = useCatalogueText(MESSAGES.en);
  const [done, setDone] = useState(1);
  return (
    <View className="gap-3">
      <SetupGuide
        title={t(K.pos_title)}
        tasks={STEPS.map((id, index) => ({
          id,
          title: t(K[id]),
          description: t(K[`${id}_hint`]),
          isComplete: index < done,
        }))}
      />
      <View className="flex-row gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={done === STEPS.length}
          onPress={() => setDone((count) => count + 1)}
        >
          {t(K.next_step)}
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setDone(0)}>
          {t(K.restart)}
        </Button>
      </View>
    </View>
  );
}
