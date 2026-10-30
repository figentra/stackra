/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Icon: Press the buttons: the icon below changes size or tone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 7 and 10); ADR 0060 (right-to-left).
 */
import { Size, TextTone } from "@stackra/ui/contracts";
import { Button, Icon as UiIcon, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_KEYS } from "#src/demos/free/icon/icon-keys.constant";

/** The demo's keys. */
const K = ICON_KEYS.icon_page;

/** Icon: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [sizeIndex, setSizeIndex] = useState(1);

  const [toneIndex, setToneIndex] = useState(0);

  const [presses, setPresses] = useState(0);

  const size = Size[sizeIndex % Size.length] ?? "md";

  const tone = TextTone[toneIndex % TextTone.length] ?? "default";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          onPress={() => {
            setSizeIndex((index) => index + 1);
            setPresses((count) => count + 1);
          }}
        >
          {t(K.next_size)}
        </Button>
        <Button
          onPress={() => {
            setToneIndex((index) => index + 1);
            setPresses((count) => count + 1);
          }}
        >
          {t(K.next_tone)}
        </Button>
        <UiIcon name="star" size={size} tone={tone} data-testid="live-icon" />
      </div>
      <Text role="status" tone="muted">
        <bdi>{t(K.state, { size, tone, presses })}</bdi>
      </Text>
    </div>
  );
}
