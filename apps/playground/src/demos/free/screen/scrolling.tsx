/**
 * Stackra file contract:
 * Purpose: the "scrolling" demo of the web Screen: A screen scrolls its own content by default. Turn scrolling off
 *          for a screen that only holds a fixed layout.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 5 and 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10,
 *          2.1.1 and 4.1.3.
 */
import { Button, Screen as UiScreen, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCREEN_KEYS } from "#src/demos/free/screen/screen-keys.constant";

/** The demo's keys. */
const K = SCREEN_KEYS.screen;

/** The box a screen sits in, tall enough to show a gap and to need scrolling. */
const BOX = "h-36 border border-border";

/** The grid that lays the samples out in one column of cards. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      {children}
    </li>
  );
}

/** A few lines of order text, tall enough to scroll in a short box. */
function Lines({
  count,
  line,
}: {
  readonly count: number;
  readonly line: (index: number) => string;
}) {
  return (
    <ul className="grid gap-1 p-3">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <Text>{line(index)}</Text>
        </li>
      ))}
    </ul>
  );
}

/** Screen: Scrolling. */
export default function Scrolling() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={GRID}>
      <Sample caption={t(K.scrolls)}>
        <UiScreen isEmbedded className={BOX} data-sample="scrolls">
          <div className="p-3">
            <Button size="sm">{t(K.press)}</Button>
          </div>
          <Lines count={12} line={(index) => t(K.line, { index: index + 1 })} />
        </UiScreen>
      </Sample>
      <Sample caption={t(K.holds)}>
        <UiScreen isEmbedded isScrollable={false} className={BOX} data-sample="holds">
          <Lines count={12} line={(index) => t(K.line, { index: index + 1 })} />
        </UiScreen>
      </Sample>
    </ul>
  );
}
