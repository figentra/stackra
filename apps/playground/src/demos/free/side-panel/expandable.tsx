/**
 * Stackra file contract:
 * Purpose: the "expandable" demo of the web SidePanel: the header's expand button gives the panel the whole area, the page behind it inert; pressed again, it goes back to the side.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371, side panel).
 */
import { Heading, SidePanel, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDE_PANEL_KEYS } from "#src/demos/free/side-panel/side-panel-keys.constant";

/** The demo's keys. */
const K = SIDE_PANEL_KEYS.side_panel;

/** The SidePanel demo: expandable. */
export default function Expandable() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-3">
      <div className="h-96 overflow-hidden rounded-[var(--radius-container)] border border-separator">
        <SidePanel label={t(K.assistant_label)} defaultState="open" defaultWidth={320}>
          <SidePanel.Inset className="gap-2 p-6">
            <Heading level={3}>{t(K.page_title)}</Heading>
            <Text tone="muted">{t(K.page_text)}</Text>
          </SidePanel.Inset>
          <SidePanel.Panel>
            <SidePanel.Handle />
            <SidePanel.Header>{t(K.assistant_label)}</SidePanel.Header>
            <SidePanel.Body>
              <Text tone="muted">{t(K.welcome_hint)}</Text>
            </SidePanel.Body>
          </SidePanel.Panel>
        </SidePanel>
      </div>
      <Text tone="muted">{t(K.expand_hint)}</Text>
    </div>
  );
}
