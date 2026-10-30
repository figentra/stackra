/**
 * Stackra file contract:
 * Purpose: the "header" demo of the native RouteProgress: the bar runs along the top of a store header while the sales
 *          report opens, with its own accessible name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); gap inventory row 29.
 */
import { Button, RouteProgress, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ROUTE_PROGRESS_DEMO_KEYS } from "#src/demos/free/route-progress/route-progress-demo-keys.constant";

/** The demo's keys. */
const K = ROUTE_PROGRESS_DEMO_KEYS.demo_free.route_progress;

/** How long the report takes to open, in ms. */
const LOAD_MS = 2400;

/** A header with a loading bar. */
export default function Header() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setLoading(false), LOAD_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);
  return (
    <View className="relative flex-row items-center justify-between gap-3 border-b border-border bg-surface p-4">
      <RouteProgress isLoading={isLoading} label={t(K.opening)} />
      <Text className="font-semibold">{t(K.store)}</Text>
      <Button size="sm" variant="secondary" isDisabled={isLoading} onPress={() => setLoading(true)}>
        {t(K.open_report)}
      </Button>
    </View>
  );
}
