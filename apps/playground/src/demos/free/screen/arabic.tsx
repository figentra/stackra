/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Screen: A right-to-left screen: the content starts at the right, and the side
 *          insets stay on the real sides of the device.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 5 and 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10,
 *          2.1.1 and 4.1.3.
 */
import { Button, Screen as UiScreen, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCREEN_KEYS } from "#src/demos/free/screen/screen-keys.constant";

/** The demo's keys. */
const K = SCREEN_KEYS.screen;

/** The box a screen sits in, tall enough to show a gap and to need scrolling. */
const BOX = "h-36 border border-border";

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

/** Screen: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" data-sample="arabic">
      <UiScreen isEmbedded className={BOX}>
        <div className="p-3">
          <Button size="sm">{t(K.arabic_press)}</Button>
        </div>
        <Text className="px-3">{t(K.arabic_card)}</Text>
        <Lines count={8} line={(index) => t(K.arabic_line, { index: index + 1 })} />
      </UiScreen>
    </div>
  );
}
