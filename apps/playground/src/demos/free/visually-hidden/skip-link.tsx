/**
 * Stackra file contract:
 * Purpose: the "skip-link" demo of the web VisuallyHidden: a "Skip to the register" link that stays out of sight
 *          until a keyboard user tabs onto it (`isFocusable`). Press Tab inside the preview to see it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Text, useCatalogueText, VisuallyHidden } from "@stackra/ui/react";
import { useId } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { VISUALLY_HIDDEN_KEYS } from "#src/demos/free/visually-hidden/visually-hidden-keys.constant";

/** The demo's keys. */
const K = VISUALLY_HIDDEN_KEYS.visually_hidden;

/** VisuallyHidden: Skip link. */
export default function SkipLink() {
  const t = useCatalogueText(MESSAGES.en);
  const registerId = useId();
  return (
    <div className="grid max-w-sm gap-3">
      <VisuallyHidden isFocusable>
        <a href={`#${registerId}`} className="text-accent-soft-foreground underline">
          {t(K.skip)}
        </a>
      </VisuallyHidden>
      <section id={registerId} tabIndex={-1} className="grid gap-1">
        <Text className="font-semibold">{t(K.register)}</Text>
        <Text tone="muted">{t(K.register_body)}</Text>
      </section>
    </div>
  );
}
