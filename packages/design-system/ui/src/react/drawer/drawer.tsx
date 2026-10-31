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
 *           route overlay's (`@stackra/navigation`). With `snapPoints`, a bottom drawer opens at the first height and
 *           its handle becomes a button (named "Resize panel" in the app's language) that steps to the next height,
 *           wrapping back to the first; HeroUI's drag still dismisses it. The height eases on the theme's curve, at once
 *           below the `full` motion level.
 *           The floating look (owner request 2026-10-29): with `inset` (the default) the panel stands 8 px clear of
 *           every screen edge with rounded corners, `size` sets a side drawer's width (400, 560, 720 or the screen less
 *           the insets), the header, sub-header and footer are ruled off and only the body scrolls. Its slide starts
 *           past the inset, and on the end and start edges it slides from the side it sits on in right-to-left too.
 *           Resize and expand (owner request 2026-10-29): a side drawer with `isResizable` has a window splitter on its
 *           inner edge (drag, or Left, Right, Home and End; `useResizeHandle`, shared with Sidebar and SidePanel), from
 *           320 px to the screen less the insets; with `isExpandable` its header has a toggle to the full width. The
 *           drawer stays an overlay over a scrim: to push or split the page, use SidePanel.
 *           Stacking: a drawer opened inside another's content is a layer over it. The layer under recesses (shifts
 *           towards its open side, scales a little, dims; only the dim below the `full` motion level), the top layer's
 *           header shows a back button that closes just that layer, Escape and a press outside close the top layer
 *           only and focus returns to the opener in the layer under (React Aria's nested modals). The design stops at
 *           `DRAWER_MAX_DEPTH`; a deeper drawer still opens, with a development warning. `Drawer.ViewStack` drills
 *           into views inside one drawer; each view carries its own header, body and footer, so the title moves with
 *           its view, and the header's back button pops the view.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312 (decisions 1 and 2); ADR 0165 (HeroUI v3
 *          on web); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
/* oxlint-disable react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the
   root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6). */
import { Drawer as HeroDrawer } from "@heroui/react";
import { useCallback, useEffect, useId, useMemo, use, useState, type ReactElement } from "react";

import type { DrawerSize } from "#contracts/enums/drawer-size.enum";
import type { SnapPoint } from "#contracts/types/snap-point.type";
import { DRAWER_MAX_DEPTH } from "#core/constants/drawer-max-depth.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useMotion } from "#react/design-system-provider/use-motion";
import { useResizeHandle } from "#react/hooks/use-resize-handle";
import { useUiText } from "#react/hooks/use-ui-text";
import { DrawerBack } from "#react/drawer/drawer-back";
import { DrawerClose } from "#react/drawer/drawer-close";
import { DrawerDescription } from "#react/drawer/drawer-description";
import { DrawerHeader } from "#react/drawer/drawer-header";
import { DrawerLayerContext } from "#react/drawer/drawer-layer-context";
import type { DrawerLayer } from "#react/drawer/drawer-layer.type";
import { DrawerSubHeader } from "#react/drawer/drawer-sub-header";
import { DrawerTitle } from "#react/drawer/drawer-title";
import type { DrawerProps } from "#react/drawer/drawer.props";
import { ViewStack } from "#react/view-stack/view-stack";
import { ViewStackContext } from "#react/view-stack/view-stack-context";

/** HeroUI's edge for each logical side: its `left` and `right` are laid out by flexbox, so they are start and end. */
const EDGE = { start: "left", end: "right", top: "top", bottom: "bottom" } as const;

/** A side drawer's width by `size`. */
const WIDTH: Readonly<Record<DrawerSize, string>> = {
  sm: "w-(--size-drawer-sm)",
  md: "w-(--size-drawer-md)",
  lg: "w-(--size-drawer-lg)",
  full: "w-full",
};

/** A side drawer's starting width in pixels by `size`, where a resize starts from. */
const SIZE_PX: Readonly<Record<Exclude<DrawerSize, "full">, number>> = {
  sm: 400,
  md: 560,
  lg: 720,
};

/** The narrowest a resized side drawer goes, in pixels. */
const MIN_WIDTH = 320;

/** The panel's frame: its padding moves into the parts, which are ruled off, and the body alone scrolls. */
const FRAME = [
  "relative overflow-hidden p-0 [--drawer-dir:1] rtl:[--drawer-dir:-1]",
  "transition-[translate,scale,filter,width,opacity] duration-(--duration-overlay-in) ease-(--ease-overlay-in) data-[resizing]:transition-none",
  "in-data-[exiting=true]:duration-(--duration-overlay-out) in-data-[exiting=true]:ease-(--ease-overlay-out)",
  "[&_[data-slot=drawer-handle]]:pt-2",
  "[&_[data-slot=drawer-body]]:m-0 [&_[data-slot=drawer-body]]:px-6 [&_[data-slot=drawer-body]]:py-5",
  "[&_[data-slot=drawer-footer]]:mt-0 [&_[data-slot=drawer-footer]]:shrink-0 [&_[data-slot=drawer-footer]]:border-t",
  "[&_[data-slot=drawer-footer]]:border-separator [&_[data-slot=drawer-footer]]:px-6 [&_[data-slot=drawer-footer]]:py-4",
  "[&_[data-slot=view-stack]]:flex [&_[data-slot=view-stack]]:min-h-0 [&_[data-slot=view-stack]]:flex-1",
  "[&_[data-slot=view-stack]]:flex-col [&_[data-slot=view-stack]]:bg-overlay [&_[data-slot=view-stack-view]]:flex [&_[data-slot=view-stack-view]]:min-h-0",
  "[&_[data-slot=view-stack-view]]:flex-1 [&_[data-slot=view-stack-view]]:flex-col",
  // A close part written outside the header sits in its row's end.
  "[&>[data-slot=drawer-close-trigger]]:top-5 [&>[data-slot=drawer-close-trigger]]:end-5 [&:has(>[data-slot=drawer-close-trigger])_[data-slot=drawer-header]]:pe-16",
].join(" ");

/** The panel's shape on each edge: floating clear of the edges, or flush. */
const SHAPE = {
  inset: {
    side: "m-2 h-[calc(100%-1rem)] max-w-[calc(100%-1rem)] rounded-[var(--radius-container)]",
    across: "m-2 w-[calc(100%-1rem)] max-h-[calc(100%-1rem)] rounded-[var(--radius-container)]",
  },
  flush: { side: "h-full max-w-full rounded-none", across: "" },
} as const;

/**
 * Where the panel waits off screen, past the inset; `--drawer-dir` mirrors it in right-to-left. The slide in starts
 * from `@starting-style` (`starting:`): React Aria's entering state ends before a frame is painted when only a
 * transition (no keyframe animation) runs, so a style keyed on it never reached the screen and the panel appeared in
 * place. The slide out keeps the exiting state, which React Aria holds until the transition ends.
 */
const OFF_SCREEN = {
  right:
    "starting:translate-x-[calc((100%+1rem)*var(--drawer-dir))] in-data-[exiting=true]:translate-x-[calc((100%+1rem)*var(--drawer-dir))]",
  left: "starting:translate-x-[calc((-100%-1rem)*var(--drawer-dir))] in-data-[exiting=true]:translate-x-[calc((-100%-1rem)*var(--drawer-dir))]",
  top: "starting:translate-y-[calc(-100%-1rem)] in-data-[exiting=true]:translate-y-[calc(-100%-1rem)]",
  bottom:
    "starting:translate-y-[calc(100%+1rem)] in-data-[exiting=true]:translate-y-[calc(100%+1rem)]",
} as const;

/** Below the `full` motion level the panel fades in and out in place instead of sliding (ADR 0501). */
const FADE = "starting:opacity-0 in-data-[exiting=true]:opacity-0";

/** How a covered layer recesses: towards its open side, a little smaller. */
const RECESS = {
  right: "translate-x-[calc(-1.5rem*var(--drawer-dir))] scale-[.97]",
  left: "translate-x-[calc(1.5rem*var(--drawer-dir))] scale-[.97]",
  top: "translate-y-3 scale-[.96]",
  bottom: "-translate-y-3 scale-[.96]",
} as const;

/** A snap point as a CSS height: pixels, or a share of the viewport. */
const heightOf = (point: SnapPoint): string =>
  typeof point === "number" ? `${point}px` : `${Number.parseFloat(point)}dvh`;

/** Marks the drawer under this one covered while this one is open (it renders only while open). */
function CoverUnder({ under }: { readonly under: DrawerLayer | null }): null {
  useEffect(() => {
    if (!under) return undefined;
    under.cover(1);
    return () => under.cover(-1);
  }, [under]);
  return null;
}

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
  size = "md",
  inset = true,
  snapPoints,
  label,
  isResizable = false,
  isExpandable = false,
  style,
  className,
  ...rest
}: DrawerProps): ReactElement {
  const edge = EDGE[placement];
  const isSide = edge === "left" || edge === "right";
  const [isExpanded, setExpanded] = useState(false);
  const [ownWidth, setOwnWidth] = useState<number | undefined>(undefined);
  // The screen less the insets; read per render, which a resize or an expand causes.
  const widest = Math.max(
    MIN_WIDTH,
    (typeof window === "undefined" ? 1280 : window.innerWidth) - (inset ? 16 : 0),
  );
  const width = Math.min(widest, ownWidth ?? (size === "full" ? widest : SIZE_PX[size]));
  const handle = useResizeHandle({
    width,
    minWidth: MIN_WIDTH,
    maxWidth: widest,
    // HeroUI's right edge is the end edge, so the inner edge is the panel's start there.
    edge: edge === "right" ? "start" : "end",
    resizing: "[data-slot=drawer-dialog]",
    onResize: (next) => setOwnWidth(Math.round(Math.min(widest, Math.max(MIN_WIDTH, next)))),
  });
  const isExpandedSide = isSide && isExpandable && isExpanded;
  const isResizedSide = isSide && isResizable && ownWidth !== undefined && !isExpandedSide;
  const t = useUiText();
  const motion = useMotion();
  const [snap, setSnap] = useState(0);
  const [covers, setCovers] = useState(0);
  const under = use(DrawerLayerContext);
  const depth = (under?.depth ?? 0) + 1;
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && depth > DRAWER_MAX_DEPTH)
      // oxlint-disable-next-line no-console -- reason: a developer warning; @stackra/ui has no logger dependency
      console.warn(
        `Drawer: ${depth} drawers are stacked; the design stops at ${DRAWER_MAX_DEPTH}.`,
      );
  }, [depth]);
  const cover = useCallback((delta: 1 | -1) => setCovers((count) => count + delta), []);
  const isKeyboardDismissable = !isKeyboardDismissDisabled;
  const layer = useMemo<DrawerLayer>(
    () => ({
      depth,
      isKeyboardDismissable,
      cover,
      isExpandable: isSide && isExpandable,
      isExpanded: isExpandedSide,
      setExpanded,
    }),
    [depth, isKeyboardDismissable, cover, isSide, isExpandable, isExpandedSide],
  );
  const isCovered = covers > 0;
  // A drill-down's view transition paints only captured layers, and HeroUI turns the page's own capture off, so the
  // backdrop (and the panel in it) is captured as a layer of its own; without it the dim drops out for the move.
  const captureName = `stackra-drawer-${useId().replaceAll(/[^a-zA-Z0-9]/gu, "")}`;
  const point = edge === "bottom" ? snapPoints?.[snap % snapPoints.length] : undefined;
  const panelClassName = [
    FRAME,
    isSide ? WIDTH[isExpandedSide ? "full" : size] : "",
    SHAPE[inset ? "inset" : "flush"][isSide ? "side" : "across"],
    motion === "full" ? OFF_SCREEN[edge] : FADE,
    isCovered ? "brightness-[.9]" : "",
    isCovered && motion === "full" ? RECESS[edge] : "",
    typeof className === "string" ? className : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <HeroDrawer.Root {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}>
      {trigger}
      <HeroDrawer.Backdrop
        {...omitUndefined({ isDismissable, isKeyboardDismissDisabled })}
        style={{ viewTransitionName: captureName }}
        // The page is already dimmed by the bottom layer; an upper layer dims the layer under it instead.
        {...(depth > 1 ? { variant: "transparent" as const } : {})}
      >
        <HeroDrawer.Content placement={edge}>
          <HeroDrawer.Dialog
            {...rest}
            className={panelClassName}
            data-depth={depth}
            {...(isCovered ? { "data-covered": "true" } : {})}
            {...(point === undefined
              ? isResizedSide
                ? { style: { ...(typeof style === "object" ? style : {}), width } }
                : omitUndefined({ style })
              : {
                  style: {
                    ...(typeof style === "object" ? style : {}),
                    height: heightOf(point),
                    maxHeight: inset ? "calc(100dvh - 1rem)" : "100dvh",
                    transition:
                      motion === "full" ? "height var(--duration-slow) var(--ease-enter)" : "none",
                  },
                })}
            {...(label ? { "aria-label": label } : {})}
          >
            <CoverUnder under={under} />
            {isSide && isResizable && !isExpandedSide ? (
              <div
                {...handle}
                role="separator"
                tabIndex={0}
                aria-orientation="vertical"
                aria-label={t(UI_KEYS.ui.drawer.resize)}
                aria-valuenow={width}
                aria-valuemin={MIN_WIDTH}
                aria-valuemax={widest}
                data-slot="drawer-resize-handle"
                className={`absolute inset-y-0 ${edge === "right" ? "start-0" : "end-0"} z-(--z-sticky) w-2 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:start-1/2 after:w-px after:bg-transparent hover:after:w-0.5 hover:after:bg-accent focus-visible:after:w-0.5 focus-visible:after:bg-focus`}
              />
            ) : null}
            {edge === "bottom" && snapPoints && snapPoints.length > 1 ? (
              <button
                type="button"
                className="mx-auto flex h-6 w-16 items-center justify-center rounded-[var(--radius-pill)] focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus"
                aria-label={t(UI_KEYS.ui.drawer.resize)}
                onClick={() => setSnap((current) => (current + 1) % snapPoints.length)}
              >
                <HeroDrawer.Handle />
              </button>
            ) : edge === "bottom" ? (
              <HeroDrawer.Handle />
            ) : null}
            {/* A view stack of the page around the drawer is not this drawer's: its back button must not pop it. */}
            <ViewStackContext value={null}>
              <DrawerLayerContext value={layer}>{children}</DrawerLayerContext>
            </ViewStackContext>
          </HeroDrawer.Dialog>
        </HeroDrawer.Content>
      </HeroDrawer.Backdrop>
    </HeroDrawer.Root>
  );
}

/** The parts of the compound, typed from HeroUI's own so the declaration output can name them. */
interface DrawerParts {
  /** The header row: an automatic back button, the title and description, the Esc hint and the close button. */
  readonly Header: typeof DrawerHeader;
  /** The title, a heading placed in the outline by its `level`, which also names the dialog. */
  readonly Title: typeof DrawerTitle;
  /** A short muted line under the title. */
  readonly Description: typeof DrawerDescription;
  /** A band under the header for a segmented control, tabs or a stepper; it stays put while the body scrolls. */
  readonly SubHeader: typeof DrawerSubHeader;
  /** The body, the only part that scrolls. */
  readonly Body: typeof HeroDrawer.Body;
  /** The footer: a row of actions at the end. */
  readonly Footer: typeof HeroDrawer.Footer;
  /** The close button, named by its required `label`. */
  readonly Close: typeof DrawerClose;
  /** The back button: pops a view, or closes this layer of stacked drawers. */
  readonly Back: typeof DrawerBack;
  /** A drill-down of views inside the drawer, each with its own header, body and footer. */
  readonly ViewStack: typeof ViewStack;
  /** One view of `Drawer.ViewStack`. */
  readonly View: typeof ViewStack.View;
}

/**
 * A drawer: a panel that floats in from an edge, by default the reading-end side, over a backdrop that blocks the page
 * until it closes. Open it from a `trigger`, or drive it with `isOpen` and `onOpenChange`; fill it with
 * `Drawer.Header` (holding `Drawer.Title`, `Drawer.Description` and `Drawer.Close`), `Drawer.SubHeader`,
 * `Drawer.Body` and `Drawer.Footer`, or with a `Drawer.ViewStack` of views. A drawer opened inside another stacks
 * over it.
 */
export const Drawer: typeof DrawerRoot & DrawerParts = Object.assign(DrawerRoot, {
  Header: DrawerHeader,
  Title: DrawerTitle,
  Description: DrawerDescription,
  SubHeader: DrawerSubHeader,
  Body: HeroDrawer.Body,
  Footer: HeroDrawer.Footer,
  Close: DrawerClose,
  Back: DrawerBack,
  ViewStack,
  View: ViewStack.View,
});
