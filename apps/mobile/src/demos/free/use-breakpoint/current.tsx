/**
 * Stackra file contract:
 * Purpose: the "current" demo of the native useBreakpoint: the window's size class and breakpoint, updating as the
 *          device rotates or the app enters split view.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Chip, Text, useBreakpoint, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { USE_BREAKPOINT_DEMO_KEYS } from "#src/demos/free/use-breakpoint/use-breakpoint-demo-keys.constant";

/** The demo's keys. */
const K = USE_BREAKPOINT_DEMO_KEYS.demo_free.use_breakpoint;

/** The size class and breakpoint of this window. */
export default function Current() {
  const t = useCatalogueText(MESSAGES.en);
  const { sizeClass, breakpoint } = useBreakpoint();
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2" accessibilityLiveRegion="polite">
        <Chip tone="accent" variant="soft">
          {t(K.current.size_class, { size: t(K.size[sizeClass]) })}
        </Chip>
        <Chip>{t(K.current.breakpoint, { breakpoint: breakpoint ?? t(K.current.base) })}</Chip>
      </View>
      <Text tone="muted">{t(K.current.rotate)}</Text>
    </View>
  );
}
