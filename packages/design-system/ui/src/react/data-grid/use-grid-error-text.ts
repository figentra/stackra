/**
 * Stackra file contract:
 * Purpose: `useGridErrorText()`, the words of a typed cell's error (required, wrong kind, below the least, above the
 *          greatest, the app's own message) in the active locale, shared by the DataGrid and the DataTable's inline edit.
 * Boundary: plain React, so the native grid imports it too; limits are written with the locale's digits.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid validation); data-collection plan (owner,
 *          2026-10-29), wave 3 (inline edit); WCAG 2.2 SC 3.3.1.
 */
import { useMemo } from "react";

import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import type { GridCellError } from "#core/types/grid-cell-error.type";
import { useUiText } from "#react/hooks/use-ui-text";

/** The grid's words. */
const K = DATA_GRID_KEYS.ui.data_grid;

/**
 * The words of a cell error.
 * @param locale - the locale the limits are written in
 * @returns a function from an error to its message
 */
export function useGridErrorText(locale: string): (error: GridCellError) => string {
  const t = useUiText();
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  return (error) => {
    switch (error.kind) {
      case "required": {
        return t(K.required);
      }
      case "type": {
        return t(K.type);
      }
      case "min": {
        return t(K.min, { limit: numbers.format(error.limit) });
      }
      case "max": {
        return t(K.max, { limit: numbers.format(error.limit) });
      }
      case "custom": {
        return error.message;
      }
    }
  };
}
