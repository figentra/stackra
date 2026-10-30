/**
 * Stackra file contract:
 * Purpose: the "alignment" demo of the web Tooltip: Along the edge the tooltip leaves open: Start lines up with the
 *          reading start of the element, End with its reading end.
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

/** The Tooltip demo: alignment. */
export default function Alignment() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      {(
        [
          ["start", t(K.align_start)],
          ["center", t(K.align_center)],
          ["end", t(K.align_end)],
        ] as const
      ).map(([align, label]) => (
        <li key={align}>
          <UiTooltip placement="bottom" align={align} content={t(K.align_text)}>
            <Button variant="secondary">{label}</Button>
          </UiTooltip>
        </li>
      ))}
    </ul>
  );
}
