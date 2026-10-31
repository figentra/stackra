/**
 * Stackra file contract:
 * Purpose: the web `Sheet` on HeroUI v3's Sheet (React Aria's scroll-snap sheet, HeroUI 3.2.7): one root that draws
 *          HeroUI's root, backdrop, content, dialog and handle around the caller's parts, on the `placement` edge
 *          (default `bottom`). It maps the shared contract onto HeroUI: `start` and `end` turned into HeroUI's physical
 *          `left` and `right` by the reading direction, `backdrop` to the backdrop's variant, `isDetached`,
 *          `snapPoints` and `isDismissable` to the root, `label` to `aria-label`, and passes every other HeroUI dialog
 *          prop through unchanged.
 * Boundary: no styling of its own beyond the theme's container radius and, on a wide screen, a top or bottom sheet
 *           capped to the medium drawer width and centred; the surface is HeroUI's, themed by `@stackra/tokens`, and
 *           draws in the `sheet` material role where glass is asked for (ADR 0501 section 9). React Aria owns the
 *           gesture: a swipe anywhere on the panel moves it until it is fully expanded (then the body scrolls), a
 *           swipe can pass several snap points at once and the full size is always the last stop; the top and bottom
 *           sheets draw HeroUI's handle, which a mouse can drag too and which is hidden from assistive technology, so
 *           a close control (`Sheet.Close`, or a button with `slot="close"`) is the keyboard's way out. Escape, a
 *           press outside and the swipe all close it unless `isDismissable` is false. A Sheet rendered inside another
 *           Sheet opens as HeroUI's nested sheet: the one under scales back, only the bottom sheet dims the page and
 *           focus returns to the sheet under when it closes. Below the `full` motion level the enter, exit and stack
 *           animations finish at once (HeroUI does the same for `prefers-reduced-motion`). While open it is the
 *           topmost shortcut scope, so page shortcuts pause (ADR 0508), as under Drawer and Modal.
 *           Sheet or Drawer (decision, STA-1371, 2026-10-31): Drawer stays the side panel for a task (sizes, resize,
 *           expand, sub-header, back button, stacked layers and drill-down views, Escape key cap); Sheet is the
 *           gesture surface, a bottom (or top) sheet with snap points that is swiped away, for a quick pick, a peek or
 *           a short form. A `start` or `end` Sheet exists for a swipeable side panel with no task chrome.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); ADR 0060
 *          (right-to-left); ADR 0501 (materials); ADR 0508 (overlay scope); owner approval 2026-10-31 (STA-1371); WCAG 2.2 SC 2.1.2, 2.4.3,
 *          2.5.1 and 4.1.2.
 */
/* oxlint-disable react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the
   root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6). */
import { Sheet as HeroSheet } from "@heroui/react";
import { use, type ComponentProps, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import { ModalShortcuts } from "#react/modal/modal-shortcuts";
import { SheetClose } from "#react/sheet/sheet-close";
import { SheetNestingContext } from "#react/sheet/sheet-nesting-context";
import { SheetTitle } from "#react/sheet/sheet-title";
import type { SheetProps } from "#react/sheet/sheet.props";

/** The theme's container radius on the corners that face the screen, by HeroUI's physical edge. */
const RADIUS = {
  bottom: "rounded-t-[var(--radius-container)]",
  top: "rounded-b-[var(--radius-container)]",
  left: "rounded-r-[var(--radius-container)]",
  right: "rounded-l-[var(--radius-container)]",
} as const;

/** A top or bottom sheet on a wide screen: centred, no wider than the medium drawer. */
const ACROSS = "sm:mx-auto sm:max-w-(--size-drawer-md)";

/** The sheet root: HeroUI's root, backdrop, content and dialog in one, holding the caller's parts. */
function SheetRoot({
  children,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable,
  placement = "bottom",
  snapPoints,
  backdrop = "opaque",
  isDetached = false,
  label,
  className,
  ...rest
}: SheetProps): ReactElement {
  const isRtl = useLocale().direction === "rtl";
  const motion = useMotion();
  const isNested = use(SheetNestingContext);
  const edge =
    placement === "start"
      ? isRtl
        ? "right"
        : "left"
      : placement === "end"
        ? isRtl
          ? "left"
          : "right"
        : placement;
  const isAcross = edge === "top" || edge === "bottom";
  const radius = isDetached ? "rounded-[var(--radius-container)]" : RADIUS[edge];
  // Below the `full` motion level HeroUI's keyframes (enter, exit, stack) run in 1 ms, as under reduced motion.
  const instant = motion === "full" ? "" : "[animation-duration:1ms]";
  const Root = isNested ? HeroSheet.NestedRoot : HeroSheet.Root;
  return (
    <Root
      placement={edge}
      isDetached={isDetached}
      {...omitUndefined({ isOpen, defaultOpen, onOpenChange, isDismissable })}
      {...(snapPoints ? { snapPoints: [...snapPoints] } : {})}
    >
      {trigger ? (
        // A cast: HeroUI types the trigger as an element taking `onPress`; the contract's trigger is any pressable.
        <HeroSheet.Trigger>
          {trigger as ComponentProps<typeof HeroSheet.Trigger>["children"]}
        </HeroSheet.Trigger>
      ) : null}
      <HeroSheet.Backdrop variant={backdrop} className={instant}>
        <HeroSheet.Content
          className={[radius, isAcross ? ACROSS : "", instant].filter(Boolean).join(" ")}
        >
          <HeroSheet.Dialog
            {...rest}
            className={[
              radius,
              // A close button in the corner keeps the header's text clear of it.
              "[&:has([data-slot=sheet-close-trigger])_[data-slot=sheet-header]]:pe-12",
              typeof className === "string" ? className : "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...(label ? { "aria-label": label } : {})}
          >
            {isAcross ? <HeroSheet.Handle /> : null}
            <SheetNestingContext value={true}>
              <ModalShortcuts>{children}</ModalShortcuts>
            </SheetNestingContext>
          </HeroSheet.Dialog>
        </HeroSheet.Content>
      </HeroSheet.Backdrop>
    </Root>
  );
}

/** The parts of the compound. */
interface SheetParts {
  /** The header: the title and any short line under it. */
  readonly Header: typeof HeroSheet.Header;
  /** The title, a heading placed in the outline by its `level`, which also names the dialog. */
  readonly Title: typeof SheetTitle;
  /** The body; it scrolls once the sheet is fully expanded. */
  readonly Body: typeof HeroSheet.Body;
  /** The footer: a row of actions at the end. */
  readonly Footer: typeof HeroSheet.Footer;
  /** The close button in the top reading-end corner, named by its required `label`. */
  readonly Close: typeof SheetClose;
}

/**
 * A sheet: a swipeable panel from a screen edge, by default the bottom, over a backdrop that blocks the page until it
 * closes. Open it from a `trigger`, or drive it with `isOpen` and `onOpenChange`; give it `snapPoints` to rest part
 * way; fill it with `Sheet.Header` (holding `Sheet.Title`), `Sheet.Body`, `Sheet.Footer` and `Sheet.Close`. A Sheet
 * opened inside another stacks over it. For a task panel on the side, use Drawer.
 */
export const Sheet: typeof SheetRoot & SheetParts = Object.assign(SheetRoot, {
  Header: HeroSheet.Header,
  Title: SheetTitle,
  Body: HeroSheet.Body,
  Footer: HeroSheet.Footer,
  Close: SheetClose,
});
