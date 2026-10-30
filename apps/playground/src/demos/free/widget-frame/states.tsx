/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web WidgetFrame: ready, loading and error.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Link, Sparkline, Stat, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { WIDGET_FRAME_KEYS } from "#src/demos/free/widget-frame/widget-frame-keys.constant";

/** The demo's keys. */
const K = WIDGET_FRAME_KEYS.widget_frame;

/** Widget frame: a ready widget, one loading, one failed that loads on retry. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const [isFailed, setFailed] = useState(true);
  return (
    <div className="grid w-full grid-cols-12 gap-4">
      <WidgetFrame
        title={t(K.sales)}
        description={t(K.range)}
        footer={<Link href="#">{t(K.view_all)}</Link>}
      >
        <Stat label={t(K.sales)} value={48_250} trend={0.12} />
        <Sparkline
          data={[12, 15, 14, 18, 17, 21, 24]}
          kind="area"
          color="chart-ramp-2"
          height={48}
          label={t(K.trend)}
        />
      </WidgetFrame>
      <WidgetFrame title={t(K.visits)} size="small" state="loading" />
      <WidgetFrame
        title={t(K.refunds)}
        size="small"
        state={isFailed ? "error" : "ready"}
        onRetry={() => setFailed(false)}
      >
        <Stat label={t(K.refunds)} value={14} trend={-0.2} better="down" />
      </WidgetFrame>
    </div>
  );
}
