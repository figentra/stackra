/**
 * Stackra file contract:
 * Purpose: the web `ActionPalette` compound on HeroUI Pro's Command (named for what it holds, because Command means a
 *          CLI command only): the root and the parts Backdrop, Container, Dialog, Header, InputGroup, List, Item,
 *          Group, Separator and Footer.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `Command.Root` is left out. Imports the `command` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0294 (decision 23); STA-403 FR-004.
 */
import { Command as HeroCommand } from "@heroui-pro/react/command";

import type { ActionPaletteContractProps } from "#contracts/types/action-palette-contract-props.type";
import { ActionPaletteDialog } from "#react/action-palette/action-palette-dialog";
import { ActionPaletteInputGroup } from "#react/action-palette/action-palette-input-group";

/** Props of the `ActionPalette` root: its children. */
export type ActionPaletteProps = ActionPaletteContractProps;

/** The root: HeroUI Pro's, which holds the palette's state context. */
function ActionPaletteRoot({ children }: ActionPaletteProps) {
  return <HeroCommand>{children}</HeroCommand>;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ActionPaletteParts {
  /** The modal overlay; takes `isOpen`, `onOpenChange`, `isDismissable` and a `variant` of blur, opaque or transparent. */
  readonly Backdrop: typeof HeroCommand.Backdrop;
  /** The modal that centres the dialog; takes a `size` of sm, md or lg. */
  readonly Container: typeof HeroCommand.Container;
  /** The dialog, named by `label`. */
  readonly Dialog: typeof ActionPaletteDialog;
  /** The header above the search input, for context chips. */
  readonly Header: typeof HeroCommand.Header;
  /** The search field row, named by `label`. */
  readonly InputGroup: typeof ActionPaletteInputGroup;
  /** The filtered list of items and groups. */
  readonly List: typeof HeroCommand.List;
  /** One action in the list. */
  readonly Item: typeof HeroCommand.Item;
  /** A headed group of items. */
  readonly Group: typeof HeroCommand.Group;
  /** A divider between items or groups. */
  readonly Separator: typeof HeroCommand.Separator;
  /** The footer under the list, for key hints. */
  readonly Footer: typeof HeroCommand.Footer;
}

/**
 * A palette of actions with search and keyboard navigation, shown as a dialog: `ActionPalette.Backdrop` holds
 * `Container`, which holds `Dialog` with its `Header`, `InputGroup`, `List` and `Footer`.
 */
export const ActionPalette: typeof ActionPaletteRoot & ActionPaletteParts = Object.assign(
  ActionPaletteRoot,
  {
    Backdrop: HeroCommand.Backdrop,
    Container: HeroCommand.Container,
    Dialog: ActionPaletteDialog,
    Header: HeroCommand.Header,
    InputGroup: ActionPaletteInputGroup,
    List: HeroCommand.List,
    Item: HeroCommand.Item,
    Group: HeroCommand.Group,
    Separator: HeroCommand.Separator,
    Footer: HeroCommand.Footer,
  },
);
