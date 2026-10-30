/**
 * Stackra file contract:
 * Purpose: the "default" demo of the native Loading overlay: the catalogue's own words when no message is given.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Card, LoadingOverlay, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LOADING_OVERLAY_DEMO_KEYS } from "#src/demos/free/loading-overlay/loading-overlay-demo-keys.constant";

/** The demo's keys. */
const K = LOADING_OVERLAY_DEMO_KEYS.demo_free.loading_overlay.default;

/** Loading overlay: the catalogue's own words when no message is given. */
export default function Default() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <LoadingOverlay isLoading>
        <Card className="grid gap-2 p-4">
          <Text className="font-medium">{t(K.title)}</Text>
          <Text tone="muted">{t(K.body)}</Text>
        </Card>
      </LoadingOverlay>
    </View>
  );
}
