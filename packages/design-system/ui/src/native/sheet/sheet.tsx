/**
 * Stackra file contract:
 * Purpose: the native `Sheet`, the counterpart of the web one with the same contract, drawn by the native `Drawer`
 *          (HeroUI Native's BottomSheet on `@gorhom/bottom-sheet`): `placement` defaults to `bottom`, `isDetached`
 *          is the drawer's `inset` (default true: every native sheet is inset, owner decision 2026-10-24), and
 *          `backdrop` picks HeroUI Native's overlay (`blur` its blur variant through `expo-blur`, `transparent` a clear
 *          one). Snap points, the drag between them (several in one drag), a drag down past the first to dismiss,
 *          the handle that screen readers step and the stacking of a sheet opened inside another are the drawer's.
 * Boundary: no new dependency. On a phone every placement is the bottom sheet (a phone has no top or side sheet); on a
 *           tablet `start` and `end` are the drawer's floating side panel. The parts are the drawer's: `Sheet.Header`,
 *           `Sheet.Title`, `Sheet.Body`, `Sheet.Footer` and `Sheet.Close`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0165 (HeroUI Native on native); owner approval
 *          2026-10-31 (STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
/* oxlint-disable react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the
   root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6). */
import type { ReactElement } from "react";

import { Drawer } from "#native/drawer/drawer";
import { SheetBackdropContext } from "#native/sheet/sheet-backdrop-context";
import type { SheetProps } from "#native/sheet/sheet.props";

/** The sheet root: a bottom drawer with the sheet's backdrop and detached look. */
function SheetRoot({
  placement = "bottom",
  backdrop = "opaque",
  isDetached = true,
  ...rest
}: SheetProps): ReactElement {
  return (
    <SheetBackdropContext value={backdrop}>
      <Drawer {...rest} placement={placement} inset={isDetached} />
    </SheetBackdropContext>
  );
}

/** The parts of the compound, the drawer's. */
interface SheetParts {
  /** The header row: the title and the close button. */
  readonly Header: typeof Drawer.Header;
  /** The title, a heading-role text. */
  readonly Title: typeof Drawer.Title;
  /** The body: a column for the content. */
  readonly Body: typeof Drawer.Body;
  /** The footer: a row for actions. */
  readonly Footer: typeof Drawer.Footer;
  /** The button that closes the sheet, named by its required `label`. */
  readonly Close: typeof Drawer.Close;
}

/**
 * A sheet: a swipeable panel from the bottom of the screen that rests at `snapPoints` and stacks when opened inside
 * another. Open it from a `trigger`, or drive it with `isOpen` and `onOpenChange`.
 */
export const Sheet: typeof SheetRoot & SheetParts = Object.assign(SheetRoot, {
  Header: Drawer.Header,
  Title: Drawer.Title,
  Body: Drawer.Body,
  Footer: Drawer.Footer,
  Close: Drawer.Close,
});
