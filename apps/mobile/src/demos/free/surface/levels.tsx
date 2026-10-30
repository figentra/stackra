/**
 * Stackra file contract:
 * Purpose: the "levels" demo of the native Surface: one surface per `variant`; transparent draws no background.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SurfaceVariant } from "@stackra/ui/contracts";
import { Surface, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SURFACE_DEMO_KEYS } from "#src/demos/free/surface/surface-demo-keys.constant";

/** The demo's keys. */
const K = SURFACE_DEMO_KEYS.demo_free.surface;

/** Every level. */
export default function Levels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {SurfaceVariant.map((variant) => (
        <Surface key={variant} variant={variant}>
          <Text>{t(K.level, { level: variant })}</Text>
          <Text type="small" tone="muted">
            {t(K.line)}
          </Text>
        </Surface>
      ))}
    </View>
  );
}
