/**
 * Stackra file contract:
 * Purpose: `ActionPalette.Dialog` on HeroUI Pro's `Command.Dialog`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; filtering, input value and the dialog props are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-004.
 */
import {
  Command as HeroCommand,
  type CommandDialogProps as HeroCommandDialogProps,
} from "@heroui-pro/react/command";

import type { ActionPaletteDialogContractProps } from "#contracts/types/action-palette-contract-props.type";

/** Props of the palette dialog: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type ActionPaletteDialogProps = ActionPaletteDialogContractProps &
  Omit<HeroCommandDialogProps, keyof ActionPaletteDialogContractProps | "aria-label">;

/** The palette dialog: holds the header, the search input, the list and the footer. */
export function ActionPaletteDialog({ label, ...rest }: ActionPaletteDialogProps) {
  return <HeroCommand.Dialog {...rest} {...(label ? { "aria-label": label } : {})} />;
}
