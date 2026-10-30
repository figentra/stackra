/**
 * Stackra file contract:
 * Purpose: the "delay" demo of the web Tooltip: A hover waits for the delay; keyboard focus never does. A disabled
 *          tooltip stays quiet and leaves the element as it was.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.4.13 and 2.5.8.
 */
import { Button, Tooltip as UiTooltip, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOOLTIP_KEYS } from "#src/demos/free/tooltip/tooltip-keys.constant";

/** The demo's keys. */
const K = TOOLTIP_KEYS.tooltip;

/** The row that lays samples out in the middle of the page, where a tooltip has room on every side. */
const ROW = "flex flex-wrap items-center justify-center gap-4";

/** Tooltip: Delay and switching off. */
export default function Delay() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiTooltip content={t(K.default_delay_text)}>
          <Button variant="secondary">{t(K.default_delay)}</Button>
        </UiTooltip>
      </li>
      <li>
        <UiTooltip delay={0} content={t(K.no_delay_text)}>
          <Button variant="secondary">{t(K.no_delay)}</Button>
        </UiTooltip>
      </li>
      <li>
        <UiTooltip isDisabled content={t(K.switched_off_text)}>
          <Button variant="secondary">{t(K.switched_off)}</Button>
        </UiTooltip>
      </li>
    </ul>
  );
}
