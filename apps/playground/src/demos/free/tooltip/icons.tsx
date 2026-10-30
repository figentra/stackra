/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the web Tooltip: An icon button is named by its label; the tooltip adds what it does,
 *          to sighted users and in the description.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.4.13 and 2.5.8.
 */
import { IconButton, Tooltip as UiTooltip, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOOLTIP_KEYS } from "#src/demos/free/tooltip/tooltip-keys.constant";

/** The demo's keys. */
const K = TOOLTIP_KEYS.tooltip;

/** The row that lays samples out in the middle of the page, where a tooltip has room on every side. */
const ROW = "flex flex-wrap items-center justify-center gap-4";

/** Tooltip: On icon buttons. */
export default function Icons() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      <li>
        <UiTooltip content={t(K.settings_text)}>
          <IconButton icon="settings" label={t(K.settings_label)} variant="secondary" />
        </UiTooltip>
      </li>
      <li>
        <UiTooltip content={t(K.alerts_text)}>
          <IconButton icon="bell" label={t(K.alerts_label)} variant="secondary" />
        </UiTooltip>
      </li>
      <li>
        <UiTooltip content={t(K.download_text)}>
          <IconButton icon="download" label={t(K.download_label)} variant="secondary" />
        </UiTooltip>
      </li>
    </ul>
  );
}
