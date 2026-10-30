/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Split view: orders beside their detail on a tablet, one at a time on a phone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, SplitView, Text, useBreakpoint, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SPLIT_VIEW_DEMO_KEYS } from "#src/demos/free/split-view/split-view-demo-keys.constant";

/** The demo's keys. */
const K = SPLIT_VIEW_DEMO_KEYS.demo_free.split_view.sample;

const ORDERS = ["1042", "1043", "1044"] as const;

/** Split view: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const isPhone = useBreakpoint().sizeClass === "phone";
  const [order, setOrder] = useState<string | undefined>(undefined);
  return (
    <View className="h-80 overflow-hidden rounded-2xl border border-border">
      <SplitView
        primaryLabel={t(K.orders)}
        secondaryLabel={t(K.details)}
        primaryWidth={220}
        isSecondaryShown={order !== undefined}
        primary={
          <View className="gap-1 p-2">
            {ORDERS.map((number) => (
              <Button
                key={number}
                variant={number === order ? "secondary" : "ghost"}
                isFullWidth
                onPress={() => setOrder(number)}
              >
                {t(K.order, { number })}
              </Button>
            ))}
          </View>
        }
        secondary={
          <View className="gap-2 p-4">
            {order === undefined ? (
              <Text tone="muted">{t(K.pick)}</Text>
            ) : (
              <>
                {isPhone ? (
                  <Button
                    variant="ghost"
                    startIcon="chevron-left"
                    onPress={() => setOrder(undefined)}
                  >
                    {t(K.back)}
                  </Button>
                ) : null}
                <Text className="font-semibold">{t(K.order, { number: order })}</Text>
                <Text tone="muted">{t(K.ready)}</Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}
