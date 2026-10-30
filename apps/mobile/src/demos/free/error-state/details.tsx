/**
 * Stackra file contract:
 * Purpose: the "details" demo of the native ErrorState: `error` is the thrown value; `isMessageShown` shows its message.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ErrorState, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_STATE_DEMO_KEYS } from "#src/demos/free/error-state/error-state-demo-keys.constant";

/** The demo's keys. */
const K = ERROR_STATE_DEMO_KEYS.demo_free.error_state.details;

/** Production hides the message unless the app says it is safe. */
export default function Details() {
  const t = useCatalogueText(MESSAGES.en);
  return <ErrorState headingLevel={3} title={t(K.heading)} error={t(K.message)} isMessageShown />;
}
