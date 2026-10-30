/**
 * Stackra file contract:
 * Purpose: the "grid" demo of the native layout primitives: product cards in two columns.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Grid, Surface, Text, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LAYOUT_DEMO_KEYS } from "#src/demos/free/layout/layout-demo-keys.constant";

/** The demo's keys. */
const K = LAYOUT_DEMO_KEYS.demo_free.layout.grid;

/** Grid: two columns. */
export default function GridDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Grid columns={2} gap="sm" accessibilityLabel={t(K.label)}>
      {[K.shirt, K.perfume, K.dates, K.abaya, K.coffee, K.mat].map((key) => (
        <Surface key={key} variant="secondary" className="h-20 items-center justify-center p-3">
          <Text>{t(key)}</Text>
        </Surface>
      ))}
    </Grid>
  );
}
