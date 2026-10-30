/**
 * Stackra file contract:
 * Purpose: the web `ColorPicker`: a saturation area and a hue slider (React Aria's colour controls, drawn by HeroUI),
 *          the house swatches and a hex field, all editing one `#rrggbb` value.
 * Boundary: the area and slider are keyboard operable and announced by React Aria; the hex field takes `#rgb` or
 *           `#rrggbb` with or without the hash (`hexColorOf`) and ignores anything else until it is valid.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 1.4.11,
 *          2.1.1, 4.1.2.
 */
import { ColorArea, ColorSlider, Label, cn } from "@heroui/react";
import { useState, type ReactElement } from "react";
import { parseColor } from "react-aria-components";

import { COLOR_SWATCHES } from "#core/constants/color-swatches.constant";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { hexColorOf } from "#core/functions/hex-color-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { SwatchGroup } from "#react/settings-cell/swatch-group";
import { TextField } from "#react/text-field/text-field";
import type { ColorPickerProps } from "#react/color-picker/color-picker.props";

/** A colour chosen from an area, a hue, swatches or typed. */
export function ColorPicker({
  label,
  description,
  value,
  defaultValue,
  onChange,
  swatches = COLOR_SWATCHES,
  isDisabled,
  className,
}: ColorPickerProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.color_picker;
  const [own, setOwn] = useState(defaultValue ?? swatches[0] ?? "#000000");
  const hex = value ?? own;
  const [typed, setTyped] = useState<string | null>(null);
  const color = parseColor(hex).toFormat("hsb");
  const set = (next: string) => {
    setTyped(null);
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const name = typeof label === "string" ? label : t(K.label);
  return (
    <div
      role="group"
      aria-label={name}
      className={cn("grid w-72 max-w-full gap-3", className) ?? ""}
    >
      {label ? <Label>{label}</Label> : null}
      <ColorArea
        aria-label={name}
        value={color}
        onChange={(next) => set(next.toString("hex").toLowerCase())}
        xChannel="saturation"
        yChannel="brightness"
        isDisabled={isDisabled ?? false}
        className="aspect-[4/3] w-full rounded-[var(--radius-container)]"
      >
        <ColorArea.Thumb />
      </ColorArea>
      <ColorSlider
        aria-label={t(K.hue)}
        channel="hue"
        value={color}
        onChange={(next) => set(next.toString("hex").toLowerCase())}
        isDisabled={isDisabled ?? false}
      >
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
      <SwatchGroup
        label={t(K.swatches)}
        swatches={swatches}
        value={hex}
        onChange={set}
        isDisabled={isDisabled}
      />
      <div className="flex items-end gap-2">
        <span
          aria-hidden
          className="size-10 shrink-0 rounded-[var(--radius-control)] border border-border"
          style={{ backgroundColor: hex }}
        />
        <TextField
          label={t(K.hex)}
          dir="ltr"
          value={typed ?? hex}
          onChange={(text) => {
            const parsed = hexColorOf(text);
            if (parsed) set(parsed);
            else setTyped(text);
          }}
          {...(isDisabled ? { isDisabled } : {})}
        />
      </div>
      {description ? <p className="text-xs text-muted">{description}</p> : null}
    </div>
  );
}
