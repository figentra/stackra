/**
 * Stackra file contract:
 * Purpose: the "container" demo of the web BackToTop: a scrolling panel of 30 orders; once scrolled 200 pixels the
 *          button shows in the panel's corner and takes the panel, and focus, back to its heading.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { BackToTop, Card, Heading, Text, useCatalogueText } from "@stackra/ui/react";
import { useId, useRef } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BACK_TO_TOP_KEYS } from "#src/demos/free/back-to-top/back-to-top-keys.constant";

/** The demo's keys. */
const K = BACK_TO_TOP_KEYS.back_to_top.container;

/** Order numbers, newest first. */
const ORDERS = Array.from({ length: 30 }, (_, position) => 2048 - position);

/** BackToTop: in a scrolling panel. */
export default function Container() {
  const t = useCatalogueText(MESSAGES.en);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  return (
    <Card className="relative w-full max-w-sm overflow-hidden p-0">
      <div
        ref={panel}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scroll region must take focus so a keyboard user can scroll it (WCAG 2.1.1)
        tabIndex={0}
        role="region"
        aria-labelledby={titleId}
        className="h-72 overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset"
      >
        <Heading level={3} id={titleId} className="p-4 pb-2">
          {t(K.title)}
        </Heading>
        <ul className="grid">
          {ORDERS.map((number) => (
            <li key={number} className="flex justify-between border-t border-separator px-4 py-3">
              <Text>{t(K.order, { number })}</Text>
              <Text tone="muted">{t(K.status)}</Text>
            </li>
          ))}
        </ul>
      </div>
      <BackToTop
        scrollRef={panel}
        threshold={200}
        focusTargetId={titleId}
        className="end-4 bottom-4"
      />
    </Card>
  );
}
