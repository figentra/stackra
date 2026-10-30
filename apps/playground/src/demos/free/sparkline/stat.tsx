/**
 * Stackra file contract:
 * Purpose: the "stat" demo of the web Sparkline: a sparkline under a headline figure in a stat tile.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Card, Sparkline, Stat, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPARKLINE_KEYS } from "#src/demos/free/sparkline/sparkline-keys.constant";

/** The demo's keys. */
const K = SPARKLINE_KEYS.sparkline;

/** Twelve weeks of revenue, in thousands. */
const WEEKS = [12, 14, 13, 17, 16, 19, 18, 22, 21, 24, 23, 27];

/** Sparkline: in a stat tile. */
export default function InStat() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="w-full max-w-xs">
      <Card.Content className="grid gap-3">
        <Stat label={t(K.stat_label)} value={27_400} badge={t(K.stat_badge)} />
        <Sparkline data={WEEKS} kind="area" color="success" label={t(K.stat_trend)} height={48} />
      </Card.Content>
    </Card>
  );
}
