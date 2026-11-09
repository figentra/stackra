/**
 * Stackra file contract:
 * Purpose: the "phone" demo of the web Frame: a customer's subscription screen inside a phone frame.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-2041.
 */
import { Button, Chip, Frame, Heading, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FRAME_KEYS } from "#src/demos/free/frame/frame-keys.constant";

/** The demo's keys. */
const K = FRAME_KEYS.frame;

/** Frame: a phone around a mobile screen. */
export default function Phone() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Frame variant="phone" className="w-64">
      <div className="flex size-full flex-col gap-3 bg-background p-4">
        <Text type="small" tone="muted">
          {t(K.subscription)}
        </Text>
        <div className="flex items-center justify-between gap-2">
          <Heading level={3}>{t(K.plan)}</Heading>
          <Chip size="sm" variant="soft" tone="success">
            {t(K.active)}
          </Chip>
        </div>
        <Text tone="muted">{t(K.renews)}</Text>
        <Button variant="secondary" isFullWidth className="mt-auto">
          {t(K.manage)}
        </Button>
      </div>
    </Frame>
  );
}
