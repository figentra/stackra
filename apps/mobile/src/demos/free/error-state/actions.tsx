/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the native ErrorState: `actions` add further next steps beside the retry.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, ErrorState, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_STATE_DEMO_KEYS } from "#src/demos/free/error-state/error-state-demo-keys.constant";

/** The demo's keys. */
const K = ERROR_STATE_DEMO_KEYS.demo_free.error_state.actions;

/** Retry, choose another file, or contact support. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ErrorState
      headingLevel={3}
      title={t(K.heading)}
      retry={{ label: t(K.retry), onPress: () => undefined }}
      actions={
        <>
          <Button variant="secondary">{t(K.choose)}</Button>
          <Button variant="tertiary">{t(K.contact)}</Button>
        </>
      }
    />
  );
}
