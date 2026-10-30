/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native WidgetFrame: ready, loading and error.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { Sparkline, Stat, WidgetFrame, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { WIDGET_FRAME_DEMO_KEYS } from "#src/demos/free/widget-frame/widget-frame-demo-keys.constant";

/** The demo's keys. */
const K = WIDGET_FRAME_DEMO_KEYS.demo_free.widget_frame.states;

/** A ready widget, one loading, one failed that loads on retry. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const [isFailed, setFailed] = useState(true);
  return (
    <View className="gap-4">
      <WidgetFrame title={t(K.sales)} description={t(K.range)}>
        <Stat label={t(K.sales)} value={48_250} trend={0.12} />
        <Sparkline
          data={[12, 15, 14, 18, 17, 21, 24]}
          kind="area"
          color="chart-ramp-2"
          height={48}
          label={t(K.trend)}
        />
      </WidgetFrame>
      <WidgetFrame title={t(K.visits)} state="loading" />
      <WidgetFrame
        title={t(K.refunds)}
        state={isFailed ? "error" : "ready"}
        onRetry={() => setFailed(false)}
      >
        <Stat label={t(K.refunds)} value={14} trend={-0.2} better="down" />
      </WidgetFrame>
    </View>
  );
}
