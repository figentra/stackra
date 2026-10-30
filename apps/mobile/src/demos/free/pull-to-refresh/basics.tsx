/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Pull to refresh: a short order list that reloads when pulled down.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { PullToRefresh, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PULL_TO_REFRESH_DEMO_KEYS } from "#src/demos/free/pull-to-refresh/pull-to-refresh-demo-keys.constant";

/** The demo's keys. */
const K = PULL_TO_REFRESH_DEMO_KEYS.demo_free.pull_to_refresh.sample;

/** Pull to refresh: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  return (
    <View className="h-72 overflow-hidden rounded-[var(--radius-container)] border border-border">
      <PullToRefresh
        label={t(K.label)}
        onRefresh={() =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              setCount((value) => value + 1);
              resolve();
            }, 1200);
          })
        }
      >
        <View className="gap-2 p-4">
          <Text type="small" tone="muted">
            {t(K.hint)} · {t(K.count, { count })}
          </Text>
          {["1042", "1043", "1044", "1045"].map((number) => (
            <Text key={number}>{t(K.order, { number })}</Text>
          ))}
        </View>
      </PullToRefresh>
    </View>
  );
}
