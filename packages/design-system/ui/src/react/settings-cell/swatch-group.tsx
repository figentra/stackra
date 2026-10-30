/**
 * Stackra file contract:
 * Purpose: `SwatchGroup`, a row of round colour swatches of which one is picked, shared by the web SettingsColorCell
 *          and ColorPicker.
 * Boundary: internal; React Aria's RadioGroup, so arrow keys move between swatches and each is read by its hex code.
 *           The picked swatch carries a ring and a check in the colour's readable contrast.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 1.4.11, 2.1.1, 4.1.2.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { Radio, RadioGroup } from "react-aria-components";

import { Icon } from "#react/icon/icon";

/** True when black text reads better than white on `hex`. */
const isLight = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  return (r ?? 0) * 0.299 + (g ?? 0) * 0.587 + (b ?? 0) * 0.114 > 160;
};

/** A row of swatches. */
export function SwatchGroup({
  swatches,
  value,
  onChange,
  label,
  isDisabled,
}: {
  readonly swatches: readonly string[];
  readonly value: string | null;
  readonly onChange: (hex: string) => void;
  readonly label: string;
  readonly isDisabled?: boolean | undefined;
}): ReactElement {
  return (
    <RadioGroup
      aria-label={label}
      orientation="horizontal"
      value={value}
      onChange={onChange}
      isDisabled={isDisabled ?? false}
      className="flex flex-wrap gap-2"
    >
      {swatches.map((hex) => (
        <Radio
          key={hex}
          value={hex}
          aria-label={hex}
          className={({ isSelected, isFocusVisible }) =>
            cn(
              "grid size-8 cursor-pointer place-items-center rounded-[var(--radius-pill)] border border-border outline-none",
              isSelected && "ring-2 ring-accent ring-offset-2 ring-offset-background",
              isFocusVisible && "outline-2 outline-offset-4 outline-focus",
            ) ?? ""
          }
          style={{ backgroundColor: hex }}
        >
          {({ isSelected }) =>
            isSelected ? (
              <Icon name="check" size="sm" className={isLight(hex) ? "text-black" : "text-white"} />
            ) : null
          }
        </Radio>
      ))}
    </RadioGroup>
  );
}
