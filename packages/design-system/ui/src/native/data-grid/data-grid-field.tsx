/**
 * Stackra file contract:
 * Purpose: the native DataGrid's field for one column in its quick-edit and bulk-edit sheets: a `Switch` for a
 *          boolean, a `Select` of the options for a select, and a `TextField` otherwise (a decimal keypad for numbers,
 *          `YYYY-MM-DD` for days, left to right for both).
 * Boundary: it edits a draft; the grid parses it on Done or Apply with `parseGridValue`.
 * Runtime: react-native
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid typed cells); ADR 0060 (RTL).
 */
import type { ReactElement } from "react";

import type { DataGridFieldProps } from "#native/data-grid/data-grid-field.props";
import { Select } from "#native/select/select";
import { Switch } from "#native/switch/switch";
import { TextField } from "#native/text-field/text-field";

/** The field that edits one column's value. */
export function DataGridField({
  column,
  draft,
  onDraftChange,
  errorMessage,
  label = column.label,
}: DataGridFieldProps): ReactElement {
  const isInvalid = errorMessage !== undefined;
  if (column.type === "boolean")
    return <Switch label={label} value={draft === true} onChange={onDraftChange} />;
  if (column.type === "select")
    return (
      <Select
        label={label}
        items={(column.options ?? []).map((option) => ({ id: option.id, label: option.label }))}
        value={typeof draft === "string" && draft !== "" ? draft : null}
        onChange={(id) => onDraftChange(id ?? "")}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
      />
    );
  const isLatin = column.type === "number" || column.type === "date";
  return (
    <TextField
      label={label}
      value={String(draft)}
      onChange={onDraftChange}
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      isRequired={column.isRequired}
      {...(column.type === "number" ? { keyboardType: "decimal-pad" as const } : {})}
      {...(column.type === "date" ? { placeholder: "YYYY-MM-DD" } : {})}
      {...(isLatin ? { style: { writingDirection: "ltr" as const } } : {})}
    />
  );
}
