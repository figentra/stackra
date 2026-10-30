/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web InlineLoading: the loading, success and error states side by side, with the default words of the active locale.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL); design-system gap inventory row 28.
 */
import { InlineLoadingStatus } from "@stackra/ui/contracts";
import { InlineLoading as UiInlineLoading, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { INLINE_LOADING_KEYS } from "#src/demos/free/inline-loading/inline-loading-keys.constant";

/** The demo's keys. */
const K = INLINE_LOADING_KEYS.inline_loading;

/** InlineLoading: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul aria-label={t(K.states)} className="grid gap-3">
      {InlineLoadingStatus.filter((status) => status !== "idle").map((status) => (
        <li key={status}>
          <UiInlineLoading status={status} />
        </li>
      ))}
    </ul>
  );
}
