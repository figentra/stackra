/**
 * Stackra file contract:
 * Purpose: `DropZoneInputProps`, props of the file input: the shared contract plus HeroUI Pro's own, with `disabled`
 *          and `aria-label` renamed.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { DropZoneInputProps as HeroDropZoneInputProps } from "@heroui-pro/react/drop-zone";

import type { DropZoneInputContractProps } from "#contracts/types/drop-zone-input-contract-props.type";

/** Props of the file input: the shared contract plus HeroUI Pro's own, with `disabled` and `aria-label` renamed. */
export type DropZoneInputProps = DropZoneInputContractProps &
  Omit<HeroDropZoneInputProps, keyof DropZoneInputContractProps | "disabled" | "aria-label">;
