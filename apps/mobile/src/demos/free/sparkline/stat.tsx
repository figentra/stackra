/**
 * Stackra file contract:
 * Purpose: the "stat" demo of the native Sparkline: a revenue tile with its trend under the figure.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (Stackra's own charts).
 */
import { Card, Sparkline, Stat, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SPARKLINE_DEMO_KEYS } from "#src/demos/free/sparkline/sparkline-demo-keys.constant";

/** The demo's keys. */
const K = SPARKLINE_DEMO_KEYS.demo_free.sparkline.stat;

const DATA = [4200, 4650, 4400, 5100, 4980, 5440, 5210, 5890, 6020, 5870, 6400, 6810];

/** A revenue tile with its trend under the figure. */
export default function InAStatTile() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="gap-3 p-4">
      <Stat label={t(K.title)} value={DATA.at(-1) ?? 0} />
      <Sparkline data={DATA} kind="area" color="chart-2" height={48} label={t(K.label)} />
    </Card>
  );
}
