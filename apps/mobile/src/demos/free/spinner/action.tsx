/**
 * Stackra file contract:
 * Purpose: the "action" demo of the native Spinner: a labelled spinner for a moment, then its result is announced.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Spinner, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SPINNER_DEMO_KEYS } from "#src/demos/free/spinner/spinner-demo-keys.constant";

/** The demo's keys. */
const K = SPINNER_DEMO_KEYS.demo_free.spinner.action;

/** How long the load runs, in milliseconds. */
const LOAD_MILLISECONDS = 1500;

/** Start and stop. */
export default function Action() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const t = useCatalogueText(MESSAGES.en);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => {
      setIsLoading(false);
      setHasLoaded(true);
    }, LOAD_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <View className="flex-row items-center gap-3">
      <Button
        size="sm"
        variant="secondary"
        isDisabled={isLoading}
        onPress={() => {
          setHasLoaded(false);
          setIsLoading(true);
        }}
      >
        {t(K.load)}
      </Button>
      {isLoading ? <Spinner size="sm" label={t(K.loading)} /> : null}
      <Text tone="muted" accessibilityLiveRegion="polite">
        {hasLoaded ? t(K.loaded) : ""}
      </Text>
    </View>
  );
}
