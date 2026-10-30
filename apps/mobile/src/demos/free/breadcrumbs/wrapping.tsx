/**
 * Stackra file contract:
 * Purpose: the "wrapping" demo of the native Breadcrumbs: a long trail wraps onto a second line.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { BreadcrumbItem } from "@stackra/ui/contracts";
import { Breadcrumbs, useCatalogueText } from "@stackra/ui/native";

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

/** Seven steps wrap instead of running off the screen. */
export default function Wrapping() {
  const t = useCatalogueText(MESSAGES.en);
  // The earlier steps only show how a link looks: their handler does nothing.
  const items: readonly BreadcrumbItem[] = PLACES.slice(0, PLACES.length).map((place) => ({
    id: place,
    label: t(K.places[place]),
    onPress: () => undefined,
  }));
  return <Breadcrumbs items={items} />;
}
