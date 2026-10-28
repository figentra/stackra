/**
 * Stackra file contract:
 * Purpose: the web `Drawer` on HeroUI v3's Drawer: one root that draws HeroUI's root, backdrop, content and dialog
 *          around the caller's parts, on the `placement` edge (default `end`, the reading-end side). It maps the
 *          shared contract onto HeroUI (`placement` turned into HeroUI's `left`, `right`, `top` or `bottom`,
 *          `isDismissable` and `isKeyboardDismissDisabled` to the backdrop, `label` to `aria-label`) and passes every
 *          other HeroUI dialog prop through unchanged.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. A drawer on the `bottom` edge
 *           shows HeroUI's drag handle, and HeroUI lets a drag from the handle, header or footer dismiss it (unless
 *           `isDismissable` is false). HeroUI lays its `left` and `right` edges out with flexbox
 *           (`justify-start`, `justify-end`), which follows the text direction, so they already are `start` and `end`
 *           and the mapping is fixed: turning them into physical sides again by direction would put the drawer on the
 *           wrong edge in right-to-left. HeroUI's slide-in animation is physical, so in right-to-left it slides from
 *           the wrong side before it settles on the right edge. React Aria traps focus, hides the page behind it and
 *           returns focus to the element that opened it. The bottom sheet a narrow screen turns a drawer into is the
 *           route overlay's (`@stackra/navigation`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 and 2); ADR 0165 (HeroUI v3
 *          on web); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
/* oxlint-disable react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the
   root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6). */
import { Drawer as HeroDrawer } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { DrawerClose } from "#react/drawer/drawer-close";
import { DrawerTitle } from "#react/drawer/drawer-title";
import type { DrawerProps } from "#react/drawer/drawer.props";

/** HeroUI's edge for each logical side: its `left` and `right` are laid out by flexbox, so they are start and end. */
const EDGE = { start: "left", end: "right", top: "top", bottom: "bottom" } as const;

/** The drawer root: HeroUI's root, backdrop, content and dialog in one, holding the caller's parts. */
function DrawerRoot({
  children,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable,
  isKeyboardDismissDisabled,
  placement = "end",
  label,
  ...rest
}: DrawerProps): ReactElement {
  const edge = EDGE[placement];
  return (
    <HeroDrawer.Root {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}>
      {trigger}
      <HeroDrawer.Backdrop {...omitUndefined({ isDismissable, isKeyboardDismissDisabled })}>
        <HeroDrawer.Content placement={edge}>
          <HeroDrawer.Dialog {...rest} {...(label ? { "aria-label": label } : {})}>
            {edge === "bottom" ? <HeroDrawer.Handle /> : null}
            {children}
          </HeroDrawer.Dialog>
        </HeroDrawer.Content>
      </HeroDrawer.Backdrop>
    </HeroDrawer.Root>
  );
}

/** The parts of the compound, typed from HeroUI's own so the declaration output can name them. */
interface DrawerParts {
  /** The header: a column for the title. */
  readonly Header: typeof HeroDrawer.Header;
  /** The title, a heading placed in the outline by its `level`, which also names the dialog. */
  readonly Title: typeof DrawerTitle;
  /** The body, which scrolls inside the drawer when the content is long. */
  readonly Body: typeof HeroDrawer.Body;
  /** The footer: a row for actions. */
  readonly Footer: typeof HeroDrawer.Footer;
  /** The close button, named by its required `label`. */
  readonly Close: typeof DrawerClose;
}

/**
 * A drawer: a panel that slides in from an edge, by default the reading-end side, over a backdrop that blocks the page
 * until it closes. Open it from a `trigger`, or drive it with `isOpen` and `onOpenChange`; fill it with
 * `Drawer.Header`, `Drawer.Title`, `Drawer.Body`, `Drawer.Footer` and `Drawer.Close`.
 */
export const Drawer: typeof DrawerRoot & DrawerParts = Object.assign(DrawerRoot, {
  Header: HeroDrawer.Header,
  Title: DrawerTitle,
  Body: HeroDrawer.Body,
  Footer: HeroDrawer.Footer,
  Close: DrawerClose,
});
