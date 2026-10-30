/**
 * Stackra file contract:
 * Purpose: the "pinned" demo of the web FullscreenBar: a full-screen invoice editor whose bar never hides (`autoHideMs={false}`), with a Save action and an Arabic title.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 32 (owner decision 2026-10-28).
 */
import { Button, FullscreenBar, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FULLSCREEN_BAR_KEYS } from "#src/demos/free/fullscreen-bar/fullscreen-bar-keys.constant";

/** The demo's keys. */
const K = FULLSCREEN_BAR_KEYS.fullscreen_bar;

/** A frame the bar pins to: `transform` makes it the containing block of the bar's fixed position. */
const FRAME =
  "relative h-72 overflow-hidden border border-separator bg-background [transform:translateZ(0)]";

/** Fullscreen bar: Always shown. */
export default function Pinned() {
  const t = useCatalogueText(MESSAGES.en);
  const [isFull, setFull] = useState(true);
  return (
    <div role="group" aria-label={t(K.screen_name)} className={FRAME}>
      {isFull ? (
        <>
          <FullscreenBar
            title={<bdi>{t(K.editor.title)}</bdi>}
            autoHideMs={false}
            actions={<Button size="sm">{t(K.editor.save)}</Button>}
            onExit={() => setFull(false)}
          />
          <Text className="p-6 pt-20">{t(K.editor.body)}</Text>
        </>
      ) : (
        <div className="grid h-full place-content-center justify-items-center gap-3">
          <Text>{t(K.exited)}</Text>
          <Button variant="secondary" onPress={() => setFull(true)}>
            {t(K.enter_again)}
          </Button>
        </div>
      )}
    </div>
  );
}
