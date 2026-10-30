/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the native ErrorState: `kind` says what failed and picks the icon.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ErrorStateKind } from "@stackra/ui/contracts";
import { ErrorState, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_STATE_DEMO_KEYS } from "#src/demos/free/error-state/error-state-demo-keys.constant";

/** The demo's keys. */
const K = ERROR_STATE_DEMO_KEYS.demo_free.error_state.kinds;

/** The catalogue segment of each kind. */
const SEGMENT = {
  unauthenticated: "unauthenticated",
  forbidden: "forbidden",
  "not-found": "not_found",
  unexpected: "unexpected",
} as const;

/** Signed out, refused, not found, unexpected. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      {ErrorStateKind.map((kind) => (
        <ErrorState
          key={kind}
          kind={kind}
          headingLevel={3}
          title={t(K[SEGMENT[kind]].title)}
          description={t(K[SEGMENT[kind]].description)}
        />
      ))}
    </View>
  );
}
