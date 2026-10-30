/**
 * Stackra file contract:
 * Purpose: the "levels" demo of the native Separator: each `variant` on the surface it matches.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SeparatorVariant, type SurfaceVariant } from "@stackra/ui/contracts";
import { Separator, Surface, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_DEMO_KEYS } from "#src/demos/free/separator/separator-demo-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_DEMO_KEYS.demo_free.separator;

/** The surface each separator level sits on. */
const SURFACE_OF: Readonly<Record<SeparatorVariant, SurfaceVariant>> = {
  default: "default",
  secondary: "secondary",
  tertiary: "tertiary",
};

/** The rule does not read the level by itself. */
export default function Levels() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {SeparatorVariant.map((variant) => (
        <Surface key={variant} variant={SURFACE_OF[variant]}>
          <View className="gap-3">
            <Text>{t(K.levels.level, { level: variant })}</Text>
            <Separator variant={variant} />
            <Text tone="muted">{t(K.paragraphs.after)}</Text>
          </View>
        </Surface>
      ))}
    </View>
  );
}
