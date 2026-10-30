/**
 * Stackra file contract:
 * Purpose: the "plain" demo of the native Alert: a title only; the description is optional.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Alert, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DEMO_KEYS } from "#src/demos/free/alert/alert-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DEMO_KEYS.demo_free.alert.plain;

/** A title and no description. */
export default function Plain() {
  const t = useCatalogueText(MESSAGES.en);
  return <Alert tone="success" title={t(K.alert_title)} />;
}
