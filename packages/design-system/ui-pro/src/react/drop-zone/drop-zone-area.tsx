/**
 * Stackra file contract:
 * Purpose: `DropZone.Area` on HeroUI Pro's area (the target files are dropped on): maps the contract's `label` to
 *          `aria-label`.
 * Boundary: no behaviour of its own; the drop handlers and every other prop are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  DropZone as HeroDropZone,
  type DropZoneAreaProps as HeroDropZoneAreaProps,
} from "@heroui-pro/react/drop-zone";

import type { DropZoneAreaContractProps } from "#contracts/types/drop-zone-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the drop area: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type DropZoneAreaProps = DropZoneAreaContractProps &
  Omit<HeroDropZoneAreaProps, keyof DropZoneAreaContractProps | "aria-label">;

/** The drop area: holds the icon, the label, the description and the trigger. */
export function DropZoneArea({ label, isDisabled, ...rest }: DropZoneAreaProps) {
  return <HeroDropZone.Area {...rest} {...omitUndefined({ isDisabled, "aria-label": label })} />;
}
