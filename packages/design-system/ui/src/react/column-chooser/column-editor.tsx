/**
 * Stackra file contract:
 * Purpose: the web `ColumnEditor`, the column chooser of the collection family: a "Columns" button that opens the
 *          `ColumnEditorPanel` (reorder, show or hide, rename, pin, width or fit, wrap, reset) in a popover.
 * Boundary: the popover only; every change is the panel's, on the `useCollection` engine it is given.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import { IconRegistryProvider } from "@stackra/icons/react";
import type { ReactElement } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { Button } from "#react/button/button";
import { ColumnEditorPanel } from "#react/column-chooser/column-editor-panel";
import type { ColumnEditorProps } from "#react/column-chooser/column-editor.props";
import { COLLECTION_ICONS } from "#react/data-table/collection-icons.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { Popover } from "#react/popover/popover";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** Arranges the columns of a collection in a popover: order, visibility, name, pin, width and wrap. */
export function ColumnEditor<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  isIconOnly = false,
}: ColumnEditorProps<TItem>): ReactElement {
  const t = useUiText();
  const name = label ?? t(DATA_GRID_KEYS.ui.data_table_tools.columns);
  const trigger = isIconOnly ? (
    <IconButton icon="columns-3" label={name} variant="secondary" size="sm" />
  ) : (
    <Button variant="secondary" size="sm" startIcon="columns-3">
      {name}
    </Button>
  );

  return (
    <IconRegistryProvider registry={COLLECTION_ICONS}>
      <Popover title={t(K.editor_title)} trigger={trigger} placement="bottom" align="end">
        <div className="w-[min(22rem,calc(100vw-2rem))]">
          <ColumnEditorPanel collection={collection} label={name} />
        </div>
      </Popover>
    </IconRegistryProvider>
  );
}
