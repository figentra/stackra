/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web SidePanel: right to left: the panel sits on the left, its border handle and arrow keys follow, and the launcher stays centred.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371, side panel).
 */
import { Heading, Icon, SidePanel, Text, TextField, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDE_PANEL_KEYS } from "#src/demos/free/side-panel/side-panel-keys.constant";

/** The demo's keys. */
const K = SIDE_PANEL_KEYS.side_panel;

/** The SidePanel demo: arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div lang="ar" dir="rtl">
      <div className="h-[26rem] overflow-hidden rounded-[var(--radius-container)] border border-separator">
        <SidePanel label={t(K.arabic_label)} variant="split" defaultState="open" defaultWidth={300}>
          <SidePanel.Inset className="gap-2 p-6">
            <Heading level={3}>{t(K.arabic_page_title)}</Heading>
            <Text tone="muted">{t(K.arabic_page_text)}</Text>
          </SidePanel.Inset>
          <SidePanel.Panel>
            <SidePanel.Handle />
            <SidePanel.Header>{t(K.arabic_recent)}</SidePanel.Header>
            <SidePanel.Body className="grid place-content-center gap-2 text-center">
              <Icon name={Icons.Sparkles} className="mx-auto text-accent" />
              <Heading level={3}>{t(K.arabic_welcome)}</Heading>
            </SidePanel.Body>
            <SidePanel.Footer>
              <TextField aria-label={t(K.arabic_ask)} placeholder={t(K.arabic_ask)} isFullWidth />
            </SidePanel.Footer>
          </SidePanel.Panel>
          <SidePanel.Launcher title={t(K.arabic_launcher)} icon={Icons.Sparkles} />
        </SidePanel>
      </div>
    </div>
  );
}
