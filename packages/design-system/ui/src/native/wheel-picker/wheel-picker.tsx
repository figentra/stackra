/**
 * Stackra file contract:
 * Purpose: the native `WheelPicker`: side-by-side snapping wheels (WheelColumn) over one band that marks the centred
 *          row; the value is the centred key of each column.
 * Boundary: the band is decoration; the columns follow the layout direction, so they mirror in right-to-left.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { WheelColumn } from "#native/wheel-picker/wheel-column";
import { WHEEL_ROW } from "#native/wheel-picker/wheel-row.constant";
import type { WheelPickerProps } from "#native/wheel-picker/wheel-picker.props";

/** Side-by-side wheels. */
export function WheelPicker({
  columns,
  value,
  defaultValue,
  onChange,
  visibleCount = 5,
  label,
  isDisabled = false,
  className,
}: WheelPickerProps): ReactElement {
  const [own, setOwn] = useState<Readonly<Record<string, string>>>(defaultValue ?? {});
  const keys = value ?? own;
  const rows = visibleCount % 2 === 0 ? visibleCount + 1 : visibleCount;
  const select = (column: string, id: string) => {
    const next = {
      ...Object.fromEntries(columns.map((c) => [c.id, keys[c.id] ?? c.items[0]?.id ?? ""])),
      [column]: id,
    };
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return (
    <View
      accessibilityLabel={label}
      className={`relative flex-row gap-1 ${isDisabled ? "opacity-60" : ""} ${className ?? ""}`}
    >
      <View
        pointerEvents="none"
        className="absolute inset-x-0 rounded-xl bg-default"
        style={{ top: (WHEEL_ROW * (rows - 1)) / 2, height: WHEEL_ROW }}
      />
      {columns.map((column) => (
        <WheelColumn
          key={column.id}
          column={column}
          selected={keys[column.id] ?? column.items[0]?.id}
          onSelect={(id) => select(column.id, id)}
          visibleCount={rows}
          isDisabled={isDisabled}
        />
      ))}
    </View>
  );
}
