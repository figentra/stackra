/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Breadcrumbs: press an earlier step to go up; Go deeper adds the next one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { BreadcrumbItem } from "@stackra/ui/contracts";
import { Breadcrumbs, Button, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BREADCRUMBS_DEMO_KEYS } from "#src/demos/free/breadcrumbs/breadcrumbs-demo-keys.constant";

/** The demo's keys. */
const K = BREADCRUMBS_DEMO_KEYS.demo_free.breadcrumbs;

/** The places of the trail, from the root down. */
const PLACES = [
  "home",
  "catalogue",
  "electronics",
  "audio",
  "headphones",
  "over_ear",
  "wireless",
] as const;

/** A trail that follows the presses; the readout names the current page. */
export default function Live() {
  const [depth, setDepth] = useState(2);
  const t = useCatalogueText(MESSAGES.en);
  const items: readonly BreadcrumbItem[] = PLACES.slice(0, depth + 1).map((place, index) => ({
    id: place,
    label: t(K.places[place]),
    onPress: () => setDepth(index),
  }));
  const current = items.at(-1)?.label ?? "";
  return (
    <View className="items-start gap-3">
      <Breadcrumbs items={items} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.live.current, { label: current })}
      </Text>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={depth === PLACES.length - 1}
        onPress={() => setDepth((value) => Math.min(value + 1, PLACES.length - 1))}
      >
        {t(K.live.deeper)}
      </Button>
    </View>
  );
}
