/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the web AI mark: each kind beside the thing it marks (an action the assistant can do,
 *          a record an agent changed, generated content with its label shown).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0360 (decision 11); ADR 0060
 *          (light, dark, RTL); STA-803.
 */
import { AiMark, Button, Surface, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { AI_MARK_KEYS } from "#src/demos/free/ai-mark/ai-mark-keys.constant";

/** The demo's keys. */
const K = AI_MARK_KEYS.ai_mark;

/** AI mark: Kinds. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-xl gap-4">
      <div className="flex items-center gap-2">
        <Button variant="secondary">{t(K.action)}</Button>
        <AiMark kind="capable" label={t(K.capable)} />
      </div>
      <Text type="small" className="flex items-center gap-2">
        <bdi>{t(K.record)}</bdi>
        <AiMark kind="changed" label={t(K.changed)} />
      </Text>
      <Surface variant="default" className="grid gap-1 p-3">
        <Text type="small">
          <bdi>{t(K.content)}</bdi>
        </Text>
        <AiMark kind="generated" label={t(K.generated)} isLabelVisible />
      </Surface>
    </div>
  );
}
