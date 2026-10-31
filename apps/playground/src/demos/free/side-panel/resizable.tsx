/**
 * Stackra file contract:
 * Purpose: the "resizable" demo of the web SidePanel: drag the panel's border to set its width live while the page reflows, or focus the border and use the arrow keys, Home and End.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371, side panel).
 */
import { Heading, SidePanel, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDE_PANEL_KEYS } from "#src/demos/free/side-panel/side-panel-keys.constant";

/** The demo's keys. */
const K = SIDE_PANEL_KEYS.side_panel;

/** The SidePanel demo: resizable. */
export default function Resizable() {
  const t = useCatalogueText(MESSAGES.en);
  const [width, setWidth] = useState(320);
  return (
    <div className="grid gap-3">
      <div className="h-96 overflow-hidden rounded-[var(--radius-container)] border border-separator">
        <SidePanel
          label={t(K.resizable_label)}
          defaultState="open"
          width={width}
          onWidthChange={setWidth}
          minWidth={240}
          maxWidth={480}
        >
          <SidePanel.Inset className="gap-2 p-6">
            <Heading level={3}>{t(K.page_title)}</Heading>
            <Text tone="muted">{t(K.page_text)}</Text>
          </SidePanel.Inset>
          <SidePanel.Panel>
            <SidePanel.Handle />
            <SidePanel.Header isExpandable={false}>{t(K.notes)}</SidePanel.Header>
            <SidePanel.Body>
              <Text>{t(K.notes_text)}</Text>
            </SidePanel.Body>
          </SidePanel.Panel>
        </SidePanel>
      </div>
      <Text tone="muted">{t(K.resize_hint)}</Text>
      <output aria-live="polite">
        <bdi>{t(K.width, { width })}</bdi>
      </output>
    </div>
  );
}
