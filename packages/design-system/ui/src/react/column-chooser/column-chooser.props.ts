/**
 * Stackra file contract:
 * Purpose: `ColumnChooserProps`, the props of the web `ColumnChooser` in `column-chooser.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); product audit 2026-10-28 (DataTable column chooser).
 */
import type { ComponentPropsWithoutRef } from "react";

import type { ColumnChooserContractProps } from "#contracts/types/column-chooser-contract-props.type";

/** Props of the ColumnChooser: the shared contract plus the attributes of its root. */
export type ColumnChooserProps = ColumnChooserContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof ColumnChooserContractProps | "children">;
