/**
 * Stackra file contract:
 * Purpose: `ActionPaletteDialogProps`, props of the palette dialog: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-004.
 */
import type { CommandDialogProps as HeroCommandDialogProps } from "@heroui-pro/react/command";

import type { ActionPaletteDialogContractProps } from "#contracts/types/action-palette-dialog-contract-props.type";

/** Props of the palette dialog: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type ActionPaletteDialogProps = ActionPaletteDialogContractProps &
  Omit<HeroCommandDialogProps, keyof ActionPaletteDialogContractProps | "aria-label">;
