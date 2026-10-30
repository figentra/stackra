/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web FloatingPanel: a support chat that floats at the bottom corner over the page,
 *          with a few messages and a reply field, opened from a button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Button, FloatingPanel, Text, TextField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FLOATING_PANEL_KEYS } from "#src/demos/free/floating-panel/floating-panel-keys.constant";

/** The demo's keys. */
const K = FLOATING_PANEL_KEYS.floating_panel.basics;

/** A chat bubble's corners. */
const BUBBLE = { borderRadius: "var(--radius-container)" } as const;

/** FloatingPanel: Support chat. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  return (
    <div className="grid justify-items-start gap-3">
      <Button isDisabled={isOpen} onPress={() => setOpen(true)}>
        {t(K.open)}
      </Button>
      <FloatingPanel
        title={t(K.title)}
        isOpen={isOpen}
        onOpenChange={setOpen}
        defaultWidth={340}
        defaultHeight={380}
      >
        <div className="flex h-full flex-col gap-3">
          <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto">
            <div
              style={BUBBLE}
              className="grid max-w-[85%] gap-0.5 justify-self-start bg-default px-3 py-2"
            >
              <Text type="small" tone="muted">
                {t(K.agent)}
              </Text>
              <Text>{t(K.greeting)}</Text>
            </div>
            <div
              style={BUBBLE}
              className="grid max-w-[85%] gap-0.5 justify-self-end bg-accent-soft px-3 py-2"
            >
              <Text type="small" tone="muted">
                {t(K.customer)}
              </Text>
              <Text>{t(K.question)}</Text>
            </div>
            <div
              style={BUBBLE}
              className="grid max-w-[85%] gap-0.5 justify-self-start bg-default px-3 py-2"
            >
              <Text type="small" tone="muted">
                {t(K.agent)}
              </Text>
              <Text>{t(K.answer)}</Text>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <TextField aria-label={t(K.message)} placeholder={t(K.message)} isFullWidth />
            <Button>{t(K.send)}</Button>
          </div>
        </div>
      </FloatingPanel>
    </div>
  );
}
