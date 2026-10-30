/**
 * Stackra file contract:
 * Purpose: the "split" demo of the web SidePanel: the split look: the page and the panel are two rounded cards on the app's background, with a gap around and between them.
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

/** The SidePanel demo: split. */
export default function Split() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="h-[26rem] overflow-hidden rounded-[var(--radius-container)] border border-separator">
      <SidePanel label={t(K.split_label)} variant="split" defaultState="open" defaultWidth={320}>
        <SidePanel.Inset className="gap-2 p-6">
          <Heading level={3}>{t(K.page_title)}</Heading>
          <Text tone="muted">{t(K.page_text)}</Text>
        </SidePanel.Inset>
        <SidePanel.Panel>
          <SidePanel.Handle />
          <SidePanel.Header>{t(K.comments)}</SidePanel.Header>
          <SidePanel.Body>
            <Text>{t(K.comments_text)}</Text>
          </SidePanel.Body>
        </SidePanel.Panel>
        <SidePanel.Launcher title={t(K.comments)} />
      </SidePanel>
    </div>
  );
}
