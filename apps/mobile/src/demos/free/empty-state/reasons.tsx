/**
 * Stackra file contract:
 * Purpose: the "reasons" demo of the native EmptyState: `reason` says why nothing is shown and picks the icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { EmptyReason } from "@stackra/ui/contracts";
import { EmptyState, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { EMPTY_STATE_DEMO_KEYS } from "#src/demos/free/empty-state/empty-state-demo-keys.constant";

/** The demo's keys. */
const K = EMPTY_STATE_DEMO_KEYS.demo_free.empty_state.reasons;

/** The catalogue segment of each reason. */
const SEGMENT = {
  "no-data": "no_data",
  "no-results": "no_results",
  "permission-denied": "permission_denied",
} as const;

/** No data yet, no match for a search, no permission. */
export default function Reasons() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {EmptyReason.map((reason) => (
        <EmptyState
          key={reason}
          reason={reason}
          headingLevel={3}
          title={t(K[SEGMENT[reason]].title)}
          description={t(K[SEGMENT[reason]].description)}
        />
      ))}
    </View>
  );
}
