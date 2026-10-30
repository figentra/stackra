/**
 * Stackra file contract:
 * Purpose: the "full-width" demo of the web Button: two buttons that span a narrow column.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0303 (decision 7).
 */
import { Button, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_KEYS } from "#src/routes/button/button-keys.constant";

/** The demo's keys. */
const K = BUTTON_KEYS.button.full_width;

/** Buttons that span their container. */
export default function FullWidth() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Button isFullWidth>{t(K.primary)}</Button>
      <Button variant="secondary" isFullWidth>
        {t(K.secondary)}
      </Button>
    </div>
  );
}
