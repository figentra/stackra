/**
 * Stackra file contract:
 * Purpose: the "inspector" demo of the web SidePanel: a details inspector beside a page: the page's own toolbar button opens and closes it, and focus goes back to that button on close.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371, side panel).
 */
import {
  Button,
  Heading,
  PropertyList,
  SidePanel,
  Text,
  useCatalogueText,
  useSidePanel,
} from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDE_PANEL_KEYS } from "#src/demos/free/side-panel/side-panel-keys.constant";

/** The demo's keys. */
const K = SIDE_PANEL_KEYS.side_panel;

/** The page's toolbar button that opens and closes the inspector. */
function Toggle() {
  const t = useCatalogueText(MESSAGES.en);
  const { state, setState, panelId } = useSidePanel();
  const isOpen = state !== "closed";
  return (
    <Button
      variant="secondary"
      size="sm"
      aria-expanded={isOpen}
      aria-controls={panelId}
      onPress={() => setState(isOpen ? "closed" : "open")}
    >
      {t(K.toggle_inspector)}
    </Button>
  );
}

/** SidePanel: Inspector. */
export default function Inspector() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="h-[26rem] overflow-hidden rounded-[var(--radius-container)] border border-separator">
      <SidePanel label={t(K.inspector_label)} defaultState="open" defaultWidth={320}>
        <SidePanel.Inset className="gap-2 p-6">
          <div className="flex items-center justify-between gap-2">
            <Heading level={3}>{t(K.page_title)}</Heading>
            <Toggle />
          </div>
          <Text tone="muted">{t(K.page_text)}</Text>
        </SidePanel.Inset>
        <SidePanel.Panel>
          <SidePanel.Header isExpandable={false}>
            <Heading level={3} className="truncate text-base">
              {t(K.inspector_title)}
            </Heading>
          </SidePanel.Header>
          <SidePanel.Body>
            <PropertyList
              items={[
                { id: "customer", label: t(K.customer), value: t(K.customer_value) },
                { id: "status", label: t(K.status), value: t(K.status_value) },
                { id: "total", label: t(K.total), value: <bdi>{t(K.total_value)}</bdi> },
              ]}
            />
          </SidePanel.Body>
        </SidePanel.Panel>
      </SidePanel>
    </div>
  );
}
