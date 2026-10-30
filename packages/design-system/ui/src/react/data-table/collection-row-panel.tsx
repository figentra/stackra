/**
 * Stackra file contract:
 * Purpose: `CollectionRowPanel`, the shared `SidePanel` a DataTable or DataView row opens in: the table or view is the
 *          inset, the open row's content the panel, resizable from the shared `SidePanel.Handle` (`useResizeHandle`),
 *          expandable and closable from its header.
 * Boundary: the open row is the caller's state; closing calls `onClose`. Everything else (the drawer below `md`, focus
 *           into the panel and back to the row that opened it, the logical end edge in right-to-left, the width easing
 *           at the `full` motion level only) is SidePanel's own.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 3 (open in a side panel); owner request
 *          2026-10-29 (STA-1371, side panel); ADR 0060 (right-to-left).
 */
import { useState, type ReactElement } from "react";

import type { SidePanelState } from "#contracts/enums/side-panel-state.enum";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import type { CollectionRowPanelProps } from "#react/data-table/collection-row-panel.props";
import { Heading } from "#react/heading/heading";
import { useUiText } from "#react/hooks/use-ui-text";
import { SidePanel } from "#react/side-panel/side-panel";

/** A table or view with the row it opened in a side panel beside it. */
export function CollectionRowPanel<TItem extends CollectionItem = CollectionItem>({
  label,
  item,
  title,
  renderPanel,
  onClose,
  children,
}: CollectionRowPanelProps<TItem>): ReactElement {
  const t = useUiText();
  const [size, setSize] = useState<SidePanelState>("open");
  return (
    <SidePanel
      label={t(COLLECTION_KEYS.ui.collection.row_panel, { label })}
      state={item ? size : "closed"}
      onStateChange={(next) => (next === "closed" ? onClose() : setSize(next))}
      defaultWidth={400}
      className="h-auto"
    >
      <SidePanel.Inset>{children}</SidePanel.Inset>
      <SidePanel.Panel>
        <SidePanel.Handle />
        <SidePanel.Header>
          <Heading level={3} className="truncate text-base">
            {title}
          </Heading>
        </SidePanel.Header>
        <SidePanel.Body>{item ? renderPanel(item) : null}</SidePanel.Body>
      </SidePanel.Panel>
    </SidePanel>
  );
}
