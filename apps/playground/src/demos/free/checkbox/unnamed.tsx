/**
 * Stackra file contract:
 * Purpose: the "unnamed" demo of the web Checkbox: A checkbox with no label takes an accessible name instead, as a
 *          table’s row selector does.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import { Checkbox as UiCheckbox, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_KEYS } from "#src/demos/free/checkbox/checkbox-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_KEYS.checkbox;

/** Checkbox: Without a visible label. */
export default function Unnamed() {
  const t = useCatalogueText(MESSAGES.en);
  return <UiCheckbox aria-label={t(K.row_selector)} />;
}
