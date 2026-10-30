/**
 * Stackra file contract:
 * Purpose: the "period" demo of the web Button group: switch a sales report between day, week and month.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Button, ButtonGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_GROUP_KEYS } from "#src/demos/free/button-group/button-group-keys.constant";

/** The demo's keys. */
const K = BUTTON_GROUP_KEYS.button_group.period;

/** Button group: switch a sales report between day, week and month. */
export default function Period() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ButtonGroup label={t(K.label)}>
      <Button>{t(K.day)}</Button>
      <Button>{t(K.week)}</Button>
      <Button>{t(K.month)}</Button>
    </ButtonGroup>
  );
}
