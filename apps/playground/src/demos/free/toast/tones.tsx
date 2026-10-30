/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Toast: One button per tone; each shows a toast that fits it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 4.1.3 and 2.2.1; ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Button, toast, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_KEYS } from "#src/demos/free/toast/toast-keys.constant";

/** The demo's keys. */
const K = TOAST_KEYS.toast;

/** The row that lays buttons out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The Toast demo: tones. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      {Enum.values(Tone).map((tone) => (
        <Button
          key={tone}
          variant="secondary"
          onPress={() => toast(t(K.tone_messages[tone]), { tone })}
        >
          {t(K.show, { tone })}
        </Button>
      ))}
    </div>
  );
}
