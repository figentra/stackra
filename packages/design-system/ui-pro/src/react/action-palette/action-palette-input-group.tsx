/**
 * Stackra file contract:
 * Purpose: `ActionPalette.InputGroup` on HeroUI Pro's `Command.InputGroup`: maps the contract's `label` to
 *          `aria-label`, and carries HeroUI Pro's Prefix, Input, ClearButton and Suffix parts.
 * Boundary: no behaviour of its own; every other prop and the four parts are HeroUI Pro's.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-004.
 */
import { Command as HeroCommand } from "@heroui-pro/react/command";

import type { ActionPaletteInputGroupProps } from "#react/action-palette/action-palette-input-group.props";

/** The parts of the input group, typed from HeroUI Pro's own so the declaration output can name them. */
interface ActionPaletteInputGroupParts {
  /** An element before the input, usually a search icon. */
  readonly Prefix: typeof HeroCommand.InputGroup.Prefix;
  /** The text input the list is filtered by. */
  readonly Input: typeof HeroCommand.InputGroup.Input;
  /** The button that clears the input. */
  readonly ClearButton: typeof HeroCommand.InputGroup.ClearButton;
  /** An element after the input, usually a key hint. */
  readonly Suffix: typeof HeroCommand.InputGroup.Suffix;
}

/** The search field row of the palette: a prefix, the input, a clear button and a suffix. */
function ActionPaletteInputGroupRoot({ label, ...rest }: ActionPaletteInputGroupProps) {
  return <HeroCommand.InputGroup {...rest} {...(label ? { "aria-label": label } : {})} />;
}

/** The search input group, with `ActionPaletteInputGroup.Prefix`, `Input`, `ClearButton` and `Suffix`. */
export const ActionPaletteInputGroup: typeof ActionPaletteInputGroupRoot &
  ActionPaletteInputGroupParts = Object.assign(ActionPaletteInputGroupRoot, {
  Prefix: HeroCommand.InputGroup.Prefix,
  Input: HeroCommand.InputGroup.Input,
  ClearButton: HeroCommand.InputGroup.ClearButton,
  Suffix: HeroCommand.InputGroup.Suffix,
});
