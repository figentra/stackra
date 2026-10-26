/**
 * Stackra file contract:
 * Purpose: `DropZoneAreaProps`, props of the drop area: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { DropZoneAreaProps as HeroDropZoneAreaProps } from "@heroui-pro/react/drop-zone";

import type { DropZoneAreaContractProps } from "#contracts/types/drop-zone-area-contract-props.type";

/** Props of the drop area: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type DropZoneAreaProps = DropZoneAreaContractProps &
  Omit<HeroDropZoneAreaProps, keyof DropZoneAreaContractProps | "aria-label">;
