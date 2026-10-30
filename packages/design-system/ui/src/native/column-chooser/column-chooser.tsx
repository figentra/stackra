/**
 * Stackra file contract:
 * Purpose: the native `ColumnChooser`: a "Columns" button that opens a popover of checkboxes, one per column of a
 *          table; unticking one hides it. The app passes the same `hiddenColumns` to its `DataTable`.
 * Boundary: composes `Popover`, `Button` and `CheckboxGroup`; the row-header column is shown ticked and disabled, so
 *           a table always names its rows. It keeps no state.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); product audit 2026-10-28 (DataTable column chooser); WCAG 2.2 SC 4.1.2.
 */
import { View } from "react-native";
import type { ReactElement } from "react";

import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { CheckboxGroup } from "#native/checkbox-group/checkbox-group";
import type { ColumnChooserProps } from "#native/column-chooser/column-chooser.props";
import { Popover } from "#native/popover/popover";

/** Picks which columns of a table are shown. */
export function ColumnChooser({
  columns,
  hiddenColumns,
  onHiddenColumnsChange,
  label,
  ...rest
}: ColumnChooserProps): ReactElement {
  const t = useUiText();
  const name = label ?? t(DATA_GRID_KEYS.ui.data_table_tools.columns);
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id;
  return (
    <View {...rest}>
      <Popover
        title={name}
        trigger={
          <Button variant="secondary" size="sm" startIcon="columns-3">
            {name}
          </Button>
        }
      >
        <CheckboxGroup
          label={name}
          options={columns.map((column) => ({
            value: column.id,
            label: column.label,
            isDisabled: column.id === rowHeaderId,
          }))}
          value={columns.map((column) => column.id).filter((id) => !hiddenColumns.includes(id))}
          onChange={(shown) =>
            onHiddenColumnsChange(
              columns
                .map((column) => column.id)
                .filter((id) => id !== rowHeaderId && !shown.includes(id)),
            )
          }
        />
      </Popover>
    </View>
  );
}
