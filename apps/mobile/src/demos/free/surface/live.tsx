/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Surface: pick a level; the surface repaints and says which one it is.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Surface, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { ChoiceGroup } from "#src/components/ui/choice-group";
import { MESSAGES } from "#src/constants/messages.constant";
import { SURFACE_DEMO_KEYS } from "#src/demos/free/surface/surface-demo-keys.constant";

/** The demo's keys. */
const K = SURFACE_DEMO_KEYS.demo_free.surface.live;

/** The level choices; level names are code and stay as they are. */
const LEVELS = SurfaceVariant.map((level) => ({ value: level, label: level }));

/** One surface, any level. */
export default function Live() {
  const [level, setLevel] = useState<SurfaceVariant>("default");
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <ChoiceGroup label={t(K.pick)} choices={LEVELS} value={level} onChange={setLevel} />
      <Surface variant={level}>
        <Text accessibilityLiveRegion="polite">{t(K.current, { level })}</Text>
      </Surface>
    </View>
  );
}
