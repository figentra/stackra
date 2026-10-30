/**
 * Stackra file contract:
 * Purpose: the "hero" demo of the web TextReveal: a hero headline whose words fade in one after another, with a
 *          button that plays it again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0329 (motion layer); ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Button, Heading, TextReveal, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_REVEAL_KEYS } from "#src/demos/free/text-reveal/text-reveal-keys.constant";

/** The demo's keys. */
const K = TEXT_REVEAL_KEYS.text_reveal;

/** TextReveal: hero. */
export default function Hero() {
  const t = useCatalogueText(MESSAGES.en);
  const [play, setPlay] = useState(0);
  return (
    <div className="grid justify-items-start gap-4">
      <Heading level={2} key={play}>
        <TextReveal>{t(K.headline)}</TextReveal>
      </Heading>
      <Button variant="secondary" onPress={() => setPlay((count) => count + 1)}>
        {t(K.replay)}
      </Button>
    </div>
  );
}
