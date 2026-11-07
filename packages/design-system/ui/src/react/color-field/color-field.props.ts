/**
 * Stackra file contract:
 * Purpose: `ColorFieldProps`, the props of the web `ColorField` in `color-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          v3 on web); ADR 0055 (one field contract); owner decision 6 of STA-350 (thin wrappers); STA-1981.
 */
import type { ColorFieldRootProps } from "@heroui/react";

import type { ColorPickerContractProps } from "#contracts/types/color-picker-contract-props.type";

/**
 * Props of the web ColorField: ColorPicker's field contract without its swatches (the value a `#rrggbb` string, empty
 * when cleared) plus HeroUI v3's colour field props, passed through unchanged. HeroUI's `fullWidth` is `isFullWidth`.
 */
export type ColorFieldProps = Omit<ColorPickerContractProps, "swatches"> &
  Omit<ColorFieldRootProps, keyof ColorPickerContractProps | "children" | "fullWidth"> & {
    /** Text shown while the field is empty, for example `#000000`. */
    readonly placeholder?: string | undefined;
    /** True to fill the width of the parent instead of the width of the content. */
    readonly isFullWidth?: boolean | undefined;
  };
