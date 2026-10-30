/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Typography: Press the button to move to the next tone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 6, 7 and 9); ADR 0060 (right-to-left).
 */
import { TextTone } from "@stackra/ui/contracts";
import { Button, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_KEYS } from "#src/demos/free/typography/typography-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_KEYS.typography;

/** Typography: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [toneIndex, setToneIndex] = useState(0);

  const [presses, setPresses] = useState(0);

  const tone = TextTone[toneIndex % TextTone.length] ?? "default";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          onPress={() => {
            setToneIndex((index) => index + 1);
            setPresses((count) => count + 1);
          }}
        >
          {t(K.next_tone)}
        </Button>
        <Text tone={tone} data-testid="live-text">
          <bdi>{t(K.latin_sample)}</bdi>
        </Text>
      </div>
      <Text role="status" type="small" tone="muted">
        <bdi>{t(K.state, { tone, presses })}</bdi>
      </Text>
    </div>
  );
}
