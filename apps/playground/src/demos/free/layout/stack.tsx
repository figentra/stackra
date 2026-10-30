/**
 * Stackra file contract:
 * Purpose: the "stack" demo of the web layout primitives: an order's steps as cards in a column with an even gap.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Stack, Surface, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { LAYOUT_KEYS } from "#src/demos/free/layout/layout-keys.constant";

/** The demo's keys. */
const K = LAYOUT_KEYS.layout.stack;

/** Stack: three cards, 8px apart. */
export default function StackDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Stack gap="sm" aria-label={t(K.label)} role="group" className="w-full max-w-sm">
      {[K.placed, K.packed, K.shipped].map((key) => (
        <Surface key={key} variant="secondary" className="p-3 text-sm">
          {t(key)}
        </Surface>
      ))}
    </Stack>
  );
}
