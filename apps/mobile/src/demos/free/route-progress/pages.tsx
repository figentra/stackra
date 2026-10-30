/**
 * Stackra file contract:
 * Purpose: the "pages" demo of the native RouteProgress: moving between Orders, Products and Reports takes a moment, and
 *          the bar shows it while the next screen loads.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The load is a timer standing in for a router's pending state.
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

/** The screens and how long the stand-in router takes to load one, in ms. */
const PAGES = ["orders", "products", "reports"] as const;
const LOAD_MS = 1600;

/** Switch screens and watch the bar. */
export default function Pages() {
  const t = useCatalogueText(MESSAGES.en);
  const [page, setPage] = useState<(typeof PAGES)[number]>("orders");
  const [pending, setPending] = useState<(typeof PAGES)[number] | null>(null);
  useEffect(() => {
    if (pending === null) return undefined;
    const timer = setTimeout(() => {
      setPage(pending);
      setPending(null);
    }, LOAD_MS);
    return () => clearTimeout(timer);
  }, [pending]);
  return (
    <View className="relative gap-4 border border-border p-4">
      <RouteProgress isLoading={pending !== null} />
      <View className="flex-row gap-2">
        {PAGES.map((each) => (
          <Button
            key={each}
            size="sm"
            variant={each === page ? "primary" : "ghost"}
            onPress={() => setPending(each)}
          >
            {t(K[each])}
          </Button>
        ))}
      </View>
      <Text>{t(K.page_body, { page: t(K[page]) })}</Text>
    </View>
  );
}
