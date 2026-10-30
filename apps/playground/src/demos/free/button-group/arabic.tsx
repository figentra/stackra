/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Button group: in Arabic the first button sits on the right.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Button, ButtonGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_GROUP_KEYS } from "#src/demos/free/button-group/button-group-keys.constant";

/** The demo's keys. */
const K = BUTTON_GROUP_KEYS.button_group.arabic;

/** Button group: in Arabic the first button sits on the right. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <ButtonGroup label={t(K.label)}>
        <Button>{t(K.day)}</Button>
        <Button>{t(K.week)}</Button>
        <Button>{t(K.month)}</Button>
      </ButtonGroup>
    </div>
  );
}
