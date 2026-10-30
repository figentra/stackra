/**
 * Stackra file contract:
 * Purpose: the "complete" demo of the web SetupGuide: every task done, so the guide starts folded with its done line; the toggle still shows the list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 17.
 */
import { SetupGuide as UiSetupGuide, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SETUP_GUIDE_KEYS } from "#src/demos/free/setup-guide/setup-guide-keys.constant";

/** The demo's keys. */
const K = SETUP_GUIDE_KEYS.setup_guide;

/** SetupGuide: All done. */
export default function Complete() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiSetupGuide
      title={t(K.store.done_title)}
      tasks={(["product", "payments", "shipping", "domain"] as const).map((id) => ({
        id,
        title: t(K.task[id]),
        isComplete: true,
      }))}
    />
  );
}
