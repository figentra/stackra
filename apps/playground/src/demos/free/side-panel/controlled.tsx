/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the web SidePanel: the app owns the state: a segmented control and the panel's own buttons move it between closed, open and expanded.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { SidePanelState } from "@stackra/ui/contracts";
import { Heading, SegmentedControl, SidePanel, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SIDE_PANEL_KEYS } from "#src/demos/free/side-panel/side-panel-keys.constant";

/** The demo's keys. */
const K = SIDE_PANEL_KEYS.side_panel;

/** SidePanel: Controlled. */
export default function Controlled() {
  const t = useCatalogueText(MESSAGES.en);
  const [state, setState] = useState<SidePanelState>("open");
  const names = {
    closed: t(K.state_closed),
    open: t(K.state_open),
    expanded: t(K.state_expanded),
  } as const;
  return (
    <div className="grid gap-3">
      <SegmentedControl
        label={t(K.controlled_label)}
        selectedKey={state}
        onSelectionChange={(key) => setState(key as SidePanelState)}
        items={[
          { id: "closed", label: names.closed },
          { id: "open", label: names.open },
          { id: "expanded", label: names.expanded },
        ]}
      />
      <div className="h-[22rem] overflow-hidden rounded-[var(--radius-container)] border border-separator">
        <SidePanel
          label={t(K.controlled_label)}
          state={state}
          onStateChange={setState}
          defaultWidth={300}
        >
          <SidePanel.Inset className="gap-2 p-6">
            <Heading level={3}>{t(K.page_title)}</Heading>
            <Text tone="muted">{t(K.page_text)}</Text>
          </SidePanel.Inset>
          <SidePanel.Panel>
            <SidePanel.Header>{t(K.activity)}</SidePanel.Header>
            <SidePanel.Body>
              <Text>{t(K.activity_text)}</Text>
            </SidePanel.Body>
          </SidePanel.Panel>
        </SidePanel>
      </div>
      <output aria-live="polite">{t(K.state, { state: names[state] })}</output>
    </div>
  );
}
