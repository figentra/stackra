/**
 * Stackra file contract:
 * Purpose: the "placement" demo of the web Popover: The four sides. When there is no room on the chosen side the
 *          popover flips to the opposite one.
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

/** Popover: Placement. */
export default function Placement() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={ROW}>
      {(
        [
          ["top", t(K.top)],
          ["bottom", t(K.bottom)],
          ["start", t(K.start)],
          ["end", t(K.end)],
        ] as const
      ).map(([placement, label]) => (
        <li key={placement}>
          <UiPopover
            placement={placement}
            title={t(K.side_title)}
            className={SURFACE}
            trigger={<Button variant="secondary">{label}</Button>}
          >
            <Body>{t(K.side_body)}</Body>
          </UiPopover>
        </li>
      ))}
    </ul>
  );
}
