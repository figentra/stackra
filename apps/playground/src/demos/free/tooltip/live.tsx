/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Tooltip: A controlled tooltip. It is shown while the switch below is on,
 *          whatever the pointer does, and the state is reported.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.4.13 and 2.5.8.
 */
import { Button, Switch, Text, Tooltip as UiTooltip, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOOLTIP_KEYS } from "#src/demos/free/tooltip/tooltip-keys.constant";

/** The demo's keys. */
const K = TOOLTIP_KEYS.tooltip;

/** The row that lays samples out in the middle of the page, where a tooltip has room on every side. */
const ROW = "flex flex-wrap items-center justify-center gap-4";

/** Tooltip: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  return (
    <div className="grid gap-6">
      <div className={ROW}>
        <UiTooltip isOpen={isLiveOpen} onOpenChange={setIsLiveOpen} content={t(K.live_text)}>
          <Button variant="secondary">{t(K.live_trigger)}</Button>
        </UiTooltip>
        <Switch label={t(K.live_show)} value={isLiveOpen} onChange={setIsLiveOpen} />
      </div>
      <Text role="status" data-testid="tooltip-state" tone="muted">
        {t(K.state, { is_open: isLiveOpen })}
      </Text>
    </div>
  );
}
