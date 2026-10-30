/**
 * Stackra file contract:
 * Purpose: the "payment" demo of the native InlineLoading: charging a card turns the spinner into "Paid" with a success haptic, or "Card declined" with an error haptic.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { InlineLoadingStatus } from "@stackra/ui/contracts";
import { Button, InlineLoading, Text, useCatalogueText } from "@stackra/ui/native";
import { useRef, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_LOADING_DEMO_KEYS } from "#src/demos/free/inline-loading/inline-loading-demo-keys.constant";

/** The demo's keys. */
const K = INLINE_LOADING_DEMO_KEYS.demo_free.inline_loading;

/** How long the fake charge takes. */
const DELAY = 1200;

/** The InlineLoading demo: a card payment that loads, succeeds or fails. */
export default function Payment() {
  const t = useCatalogueText(MESSAGES.en);
  const [status, setStatus] = useState<InlineLoadingStatus>("idle");
  const declinesNext = useRef(false);
  const charge = () => {
    setStatus("loading");
    setTimeout(() => {
      setStatus(declinesNext.current ? "error" : "success");
      declinesNext.current = false;
    }, DELAY);
  };
  return (
    <View className="gap-3">
      <Text className="font-medium">{t(K.total)}</Text>
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" isDisabled={status === "loading"} onPress={charge}>
          {t(K.charge)}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => {
            declinesNext.current = true;
          }}
        >
          {t(K.decline_next)}
        </Button>
      </View>
      <InlineLoading
        status={status}
        loadingLabel={t(K.charging)}
        successLabel={t(K.paid)}
        errorLabel={t(K.declined)}
      />
    </View>
  );
}
