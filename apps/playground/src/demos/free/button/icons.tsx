/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the web Button: a start icon, an end icon that mirrors in RTL, and both.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0303 (decision 7).
 */
import { Button, Icon, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BUTTON_KEYS } from "#src/routes/button/button-keys.constant";

/** The demo's keys. */
const K = BUTTON_KEYS.button.icons;

/** A sample with its prop names captioned underneath, left to right. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-start gap-2">
      {children}
      <Text type="small" tone="muted">
        <bdi dir="ltr">{caption}</bdi>
      </Text>
    </li>
  );
}

/** Start, end and both icons. */
export default function Icons() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="flex flex-wrap items-start gap-4">
      <Sample caption="startIcon">
        <Button variant="secondary" startIcon="plus">
          {t(K.add)}
        </Button>
      </Sample>
      <Sample caption="endIcon">
        <Button variant="secondary" endIcon={<Icon name="chevron-right" />}>
          {t(K.next)}
        </Button>
      </Sample>
      <Sample caption="startIcon + endIcon">
        <Button variant="secondary" startIcon="download" endIcon={<Icon name="chevron-right" />}>
          {t(K.download)}
        </Button>
      </Sample>
    </ul>
  );
}
