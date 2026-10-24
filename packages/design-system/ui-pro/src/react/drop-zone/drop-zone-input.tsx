/**
 * Stackra file contract:
 * Purpose: `DropZone.Input` on HeroUI Pro's file input: maps the contract's `label` to `aria-label` and `isDisabled`
 *          to the native `disabled` attribute.
 * Boundary: no behaviour of its own; `onSelect`, `accept`, `multiple` and every other prop are HeroUI Pro's, passed
 *          through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  DropZone as HeroDropZone,
  type DropZoneInputProps as HeroDropZoneInputProps,
} from "@heroui-pro/react/drop-zone";

import type { DropZoneInputContractProps } from "#contracts/types/drop-zone-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the file input: the shared contract plus HeroUI Pro's own, with `disabled` and `aria-label` renamed. */
export type DropZoneInputProps = DropZoneInputContractProps &
  Omit<HeroDropZoneInputProps, keyof DropZoneInputContractProps | "disabled" | "aria-label">;

/** The file input behind the trigger: the browser's picker, which calls `onSelect` with the chosen files. */
export function DropZoneInput({ label, isDisabled, ...rest }: DropZoneInputProps) {
  return (
    <HeroDropZone.Input
      {...rest}
      {...omitUndefined({ disabled: isDisabled, "aria-label": label })}
    />
  );
}
