/**
 * Stackra file contract:
 * Purpose: the "stack" demo of the native layout primitives: an order's steps as cards in a column with an even gap.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Stack, Surface, Text, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LAYOUT_DEMO_KEYS } from "#src/demos/free/layout/layout-demo-keys.constant";

/** The demo's keys. */
const K = LAYOUT_DEMO_KEYS.demo_free.layout.stack;

/** Stack: three cards, 8px apart. */
export default function StackDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Stack gap="sm" accessibilityLabel={t(K.label)}>
      {[K.placed, K.packed, K.shipped].map((key) => (
        <Surface key={key} variant="secondary" className="p-3">
          <Text>{t(key)}</Text>
        </Surface>
      ))}
    </Stack>
  );
}
