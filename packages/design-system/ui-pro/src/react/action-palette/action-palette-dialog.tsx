/**
 * Stackra file contract:
 * Purpose: `ActionPalette.Dialog` on HeroUI Pro's `Command.Dialog`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; filtering, input value and the dialog props are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-004.
 */
import { Command as HeroCommand } from "@heroui-pro/react/command";

import type { ActionPaletteDialogProps } from "#react/action-palette/action-palette-dialog.props";

/** The palette dialog: holds the header, the search input, the list and the footer. */
export function ActionPaletteDialog({ label, ...rest }: ActionPaletteDialogProps) {
  return <HeroCommand.Dialog {...rest} {...(label ? { "aria-label": label } : {})} />;
}
