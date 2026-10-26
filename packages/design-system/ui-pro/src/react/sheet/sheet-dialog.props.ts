/**
 * Stackra file contract:
 * Purpose: `SheetDialogProps`, props of `Sheet.Dialog`: the shared contract plus HeroUI Pro's own, with `aria-label`
 *          renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { SheetDialogProps as HeroSheetDialogProps } from "@heroui-pro/react/sheet";

import type { SheetDialogContractProps } from "#contracts/types/sheet-contract-props.type";

/** Props of `Sheet.Dialog`: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SheetDialogProps = SheetDialogContractProps &
  Omit<HeroSheetDialogProps, keyof SheetDialogContractProps | "aria-label">;
