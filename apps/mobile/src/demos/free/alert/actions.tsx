/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the native Alert: `actions`, the reader's next step under the description.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Alert, Button, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DEMO_KEYS } from "#src/demos/free/alert/alert-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DEMO_KEYS.demo_free.alert.actions;

/** A failed payment with two next steps. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Alert
      tone="danger"
      title={t(K.alert_title)}
      description={t(K.alert_description)}
      actions={
        <>
          <Button size="sm">{t(K.retry)}</Button>
          <Button size="sm" variant="tertiary">
            {t(K.contact)}
          </Button>
        </>
      }
    />
  );
}
