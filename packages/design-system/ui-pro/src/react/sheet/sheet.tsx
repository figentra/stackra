/**
 * Stackra file contract:
 * Purpose: the web `Sheet` compound on HeroUI Pro's Sheet (a panel that slides in from an edge): `Sheet.Dialog` names
 *          its dialog from `label`; the root and every other part (Trigger, Close, Backdrop, Content, Header, Heading,
 *          Body, Footer, Handle, CloseTrigger, NestedRoot) are HeroUI Pro's own. The root's `isOpen`, `isDetached`
 *          and `isDismissable` already follow the vocabulary.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The root is a thin function
 *          so the compound never changes HeroUI Pro's own component. Imports the `sheet` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import { Sheet as HeroSheet } from "@heroui-pro/react/sheet";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SheetProps } from "#react/sheet/sheet.props";
import type { SheetDialogProps } from "#react/sheet/sheet-dialog.props";

/** The root: HeroUI Pro's, which holds the open state, the edge and the snap points. */
function SheetRoot(props: SheetProps) {
  return <HeroSheet.Root {...props} />;
}

/** The dialog surface: HeroUI Pro's, named by `label` (a `Sheet.Heading` inside names it too). */
function SheetDialog({ label, ...rest }: SheetDialogProps) {
  return <HeroSheet.Dialog {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface SheetParts {
  /** Wraps the element that opens the sheet. */
  readonly Trigger: typeof HeroSheet.Trigger;
  /** Wraps an element that closes the sheet. */
  readonly Close: typeof HeroSheet.Close;
  /** The dimmed layer behind the sheet. */
  readonly Backdrop: typeof HeroSheet.Backdrop;
  /** The sliding panel. */
  readonly Content: typeof HeroSheet.Content;
  /** The dialog surface inside the panel, named by `label`. */
  readonly Dialog: typeof SheetDialog;
  /** The top section. */
  readonly Header: typeof HeroSheet.Header;
  /** The title, which also names the dialog. */
  readonly Heading: typeof HeroSheet.Heading;
  /** The scrollable middle section. */
  readonly Body: typeof HeroSheet.Body;
  /** The bottom section. */
  readonly Footer: typeof HeroSheet.Footer;
  /** The grip that drags the sheet and cycles its snap points. */
  readonly Handle: typeof HeroSheet.Handle;
  /** An icon-only button that closes the sheet. */
  readonly CloseTrigger: typeof HeroSheet.CloseTrigger;
  /** A sheet opened from inside another sheet. */
  readonly NestedRoot: typeof HeroSheet.NestedRoot;
}

/**
 * A panel that slides in from an edge: `Sheet.Trigger` opens it, `Sheet.Backdrop` and `Sheet.Content` draw it, and
 * `Sheet.Dialog` holds `Sheet.Header`, `Sheet.Body` and `Sheet.Footer`.
 */
export const Sheet: typeof SheetRoot & SheetParts = Object.assign(SheetRoot, {
  Trigger: HeroSheet.Trigger,
  Close: HeroSheet.Close,
  Backdrop: HeroSheet.Backdrop,
  Content: HeroSheet.Content,
  Dialog: SheetDialog,
  Header: HeroSheet.Header,
  Heading: HeroSheet.Heading,
  Body: HeroSheet.Body,
  Footer: HeroSheet.Footer,
  Handle: HeroSheet.Handle,
  CloseTrigger: HeroSheet.CloseTrigger,
  NestedRoot: HeroSheet.NestedRoot,
});
