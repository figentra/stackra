/**
 * Stackra file contract:
 * Purpose: the "alignment" demo of the web Popover: Along the edge the popover leaves open: Start lines up with the
 *          reading start of the trigger, End with its reading end.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL); WCAG 2.2 SC 2.1.2 and 2.5.8.
 */
import { Button, Popover as UiPopover, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { POPOVER_KEYS } from "#src/demos/free/popover/popover-keys.constant";

/** The demo's keys. */
const K = POPOVER_KEYS.popover;

/** The row that lays samples out in the middle of the page, where a popover has room on every side. */
const ROW = "flex flex-wrap items-center justify-center gap-4";

/** The width of a popover's surface, so every sample is the same size and the placement checks are steady. */
const SURFACE = "max-w-72";

/** One short paragraph of popover content; `<bdi>` keeps an English full stop at its end inside a right-to-left page. */
function Body({ children }: { readonly children: string }) {
  return (
    <Text>
      <bdi>{children}</bdi>
    </Text>
  );
}

/** The Popover demo: alignment. */
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
          <UiPopover
            placement="bottom"
            align={align}
            title={t(K.align_title)}
            className={SURFACE}
            trigger={<Button variant="secondary">{label}</Button>}
          >
            <Body>{t(K.align_body)}</Body>
          </UiPopover>
        </li>
      ))}
    </ul>
  );
}
