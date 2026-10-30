/**
 * Stackra file contract:
 * Purpose: the "navigation" demo of the native RouteProgress: start a load and the bar trickles across the top of the
 *          frame from the leading edge; finish it and the bar fills and fades.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 29.
 */
import { Button, RouteProgress, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ROUTE_PROGRESS_DEMO_KEYS } from "#src/demos/free/route-progress/route-progress-demo-keys.constant";

/** The demo's keys. */
const K = ROUTE_PROGRESS_DEMO_KEYS.demo_free.route_progress;

/** Start and finish a load. */
export default function Navigation() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLoading, setLoading] = useState(false);
  return (
    <View className="relative items-center gap-3 border border-border p-6">
      <RouteProgress isLoading={isLoading} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {isLoading ? t(K.loading) : t(K.ready)}
      </Text>
      <Button size="sm" variant="secondary" onPress={() => setLoading((now) => !now)}>
        {isLoading ? t(K.finish) : t(K.start)}
      </Button>
    </View>
  );
}
