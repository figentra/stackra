/**
 * Stackra file contract:
 * Purpose: the "assistant" demo of the web SidePanel: an assistant panel that is part of the page: a floating launcher opens it, it pushes the page, and its header can expand or close it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371, side panel).
 */
import {
  Button,
  Heading,
  Icon,
  IconButton,
  SidePanel,
  Text,
  TextField,
  useCatalogueText,
  useSidePanel,
} from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDE_PANEL_KEYS } from "#src/demos/free/side-panel/side-panel-keys.constant";

/** The demo's keys. */
const K = SIDE_PANEL_KEYS.side_panel;

/** The launcher's input: focusing it opens the panel. */
function Ask() {
  const t = useCatalogueText(MESSAGES.en);
  const { setState } = useSidePanel();
  return (
    <TextField aria-label={t(K.ask)} placeholder={t(K.ask)} onFocus={() => setState("open")} />
  );
}

/** SidePanel: Assistant. */
export default function Assistant() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="h-[30rem] overflow-hidden rounded-[var(--radius-container)] border border-separator">
      <SidePanel label={t(K.assistant_label)}>
        <SidePanel.Inset className="gap-2 p-6">
          <Heading level={3}>{t(K.page_title)}</Heading>
          <Text tone="muted">{t(K.page_text)}</Text>
        </SidePanel.Inset>
        <SidePanel.Panel>
          <SidePanel.Handle />
          <SidePanel.Header>
            <Button variant="ghost" size="sm">
              <Icon name={Icons.Clock} size="sm" />
              {t(K.recent)}
            </Button>
          </SidePanel.Header>
          <SidePanel.Body className="grid place-content-center gap-2 text-center">
            <Icon name={Icons.Sparkles} className="mx-auto text-accent" />
            <Heading level={3}>{t(K.welcome)}</Heading>
            <Text tone="muted">{t(K.welcome_hint)}</Text>
          </SidePanel.Body>
          <SidePanel.Footer className="flex items-end gap-2">
            <TextField aria-label={t(K.ask)} placeholder={t(K.ask)} isFullWidth data-autofocus />
            <IconButton icon={Icons.SendHorizontal} label={t(K.send)} />
          </SidePanel.Footer>
        </SidePanel.Panel>
        <SidePanel.Launcher title={t(K.launcher)} icon={Icons.Sparkles}>
          <Ask />
        </SidePanel.Launcher>
      </SidePanel>
    </div>
  );
}
