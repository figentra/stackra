/**
 * Stackra file contract:
 * Purpose: the native `Drawer`, the adapted form of the web one: a phone has no side panel for a task, so the drawer
 *          is HeroUI Native's BottomSheet (a `@gorhom/bottom-sheet` panel with a drag handle) drawn from the bottom
 *          edge, with the contract's names: `isDefaultOpen` is `defaultOpen`, and the overlay's `isCloseOnPress` and
 *          the sheet's `enablePanDownToClose` are both `isDismissable`. Every other HeroUI Native sheet-content prop
 *          (`index`, `detached` and so on) passes through. `snapPoints` are the contract's heights (points or
 *          `"50%"`): a drag moves between them and a drag down past the first dismisses, all `@gorhom/bottom-sheet`'s;
 *          with two or more the grab bar is `DrawerHandle`, which screen readers adjust one snap point at a time.
 * Boundary: built on HeroUI Native's free BottomSheet and Dialog. On a phone every drawer is the sheet; on a tablet
 *           (768 points wide and up) a `start` or `end` drawer is a floating side panel instead (owner request
 *           2026-10-29): HeroUI Native's Dialog laid against that edge (Yoga mirrors it in right-to-left), `size`
 *           wide (400, 560, 720 or the screen), 8 points clear of the edges and the safe areas with rounded corners
 *           unless `inset` is false, sliding in from its edge. `isKeyboardDismissDisabled` blocks the Android back
 *           button on the panel; the sheet has no Escape key and leaves back to the app. A drawer opened inside another
 *           is a layer over it whose header shows a back button that closes just that layer; `Drawer.ViewStack`
 *           drills into views inside one drawer, popped by the same button. Header, Body and Footer are the adapted forms shared with `Modal`; Title and Close
 *           are HeroUI Native's, with the contract's props. The portal asks iOS VoiceOver to stay inside the sheet
 *           (`unstable_accessibilityContainerViewIsModal`, which HeroUI Native marks unstable). Needs the app's
 *           `HeroUINativeProvider`, GestureHandlerRootView and the `@gorhom/bottom-sheet` peer.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native
 *          on native); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
/* oxlint-disable react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the
   root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6). */
import { BottomSheet, Dialog } from "heroui-native";
import {
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactElement,
} from "react";
import { useWindowDimensions } from "react-native";
import { SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DrawerSize } from "#contracts/enums/drawer-size.enum";
import { DRAWER_MAX_DEPTH } from "#core/constants/drawer-max-depth.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { DrawerBack } from "#native/drawer/drawer-back";
import { DrawerClose } from "#native/drawer/drawer-close";
import { DrawerDescription } from "#native/drawer/drawer-description";
import { DrawerHeader } from "#native/drawer/drawer-header";
import { DrawerHandle } from "#native/drawer/drawer-handle";
import { DrawerLayerContext } from "#native/drawer/drawer-layer-context";
import type { DrawerLayer } from "#native/drawer/drawer-layer.type";
import { DrawerSnapContext } from "#native/drawer/drawer-snap-context";
import type { DrawerSnap } from "#native/drawer/drawer-snap.type";
import { DrawerSubHeader } from "#native/drawer/drawer-sub-header";
import { DrawerTitle } from "#native/drawer/drawer-title";
import { BackButtonBlock } from "#native/modal/back-button-block";
import { ModalBody } from "#native/modal/modal-body";
import { ModalFooter } from "#native/modal/modal-footer";
import { ViewStack } from "#native/view-stack/view-stack";
import { ViewStackContext } from "#native/view-stack/view-stack-context";
import type { DrawerProps } from "#native/drawer/drawer.props";

/** The narrowest screen, in points, that draws a side drawer as a panel instead of a sheet. */
const TABLET_WIDTH = 768;

/** The gap between a floating drawer and the screen's edges, in points. */
const INSET = 8;

/** A side panel's width by `size`, capped to the screen. */
const PANEL_WIDTH: Readonly<Record<DrawerSize, string>> = {
  sm: "w-drawer-sm max-w-full",
  md: "w-drawer-md max-w-full",
  lg: "w-drawer-lg max-w-full",
  full: "self-stretch",
};

/** The drawer root: a bottom sheet on a phone, a floating side panel on a tablet, holding the caller's parts. */
function DrawerRoot({
  children,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = true,
  isKeyboardDismissDisabled = false,
  placement = "end",
  size = "md",
  inset = true,
  snapPoints,
  label,
  onChange,
  ...rest
}: DrawerProps): ReactElement {
  const sheet = useRef<ComponentRef<typeof BottomSheet.Content>>(null);
  const [snapIndex, setSnapIndex] = useState(0);
  const snapCount = snapPoints?.length ?? 0;
  const snap = useMemo<DrawerSnap | null>(
    () =>
      snapCount > 1
        ? {
            index: snapIndex,
            count: snapCount,
            snapTo: (index) =>
              sheet.current?.snapToIndex(Math.min(Math.max(index, 0), snapCount - 1)),
          }
        : null,
    [snapIndex, snapCount],
  );
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isRtl = use(DesignSystemContext)?.direction === "rtl";
  const under = use(DrawerLayerContext);
  const isPanel = width >= TABLET_WIDTH && (placement === "start" || placement === "end");
  const layer = useMemo<DrawerLayer>(
    () => ({ depth: (under?.depth ?? 0) + 1, isPanel }),
    [under, isPanel],
  );
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && layer.depth > DRAWER_MAX_DEPTH)
      // oxlint-disable-next-line no-console -- reason: a developer warning; @stackra/ui has no logger dependency
      console.warn(
        `Drawer: ${layer.depth} drawers are stacked; the design stops at ${DRAWER_MAX_DEPTH}.`,
      );
  }, [layer.depth]);
  const open = {
    ...omitUndefined({ isOpen, onOpenChange }),
    ...(defaultOpen === undefined ? {} : { isDefaultOpen: defaultOpen }),
  };
  // A view stack of the screen around the drawer is not this drawer's: its back button must not pop it.
  const parts = (
    <ViewStackContext value={null}>
      <DrawerLayerContext value={layer}>{children}</DrawerLayerContext>
    </ViewStackContext>
  );
  if (isPanel) {
    // The end edge is the right in left-to-right; Yoga's `items-end` already follows the direction.
    const fromRight = (placement === "end") !== isRtl;
    const gap = inset ? INSET : 0;
    return (
      <Dialog {...open}>
        {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
        <Dialog.Portal
          className={`justify-start p-0 ${placement === "end" ? "items-end" : "items-start"}`}
          unstable_accessibilityContainerViewIsModal
        >
          <Dialog.Overlay isCloseOnPress={isDismissable} />
          <Dialog.Content
            animation={
              fromRight
                ? { entering: SlideInRight, exiting: SlideOutRight }
                : { entering: SlideInLeft, exiting: SlideOutLeft }
            }
            className={`flex-1 ${PANEL_WIDTH[size]} ${inset ? "rounded-[var(--radius-container)]" : "rounded-none"}`}
            style={{
              marginTop: insets.top + gap,
              marginBottom: insets.bottom + gap,
              marginHorizontal: gap,
            }}
            isSwipeable={isDismissable}
            {...(label ? { accessibilityLabel: label } : {})}
          >
            {parts}
          </Dialog.Content>
          <BackButtonBlock isBlocked={isKeyboardDismissDisabled} />
        </Dialog.Portal>
      </Dialog>
    );
  }
  // Owner decision 2026-10-24: every native sheet is HeroUI Native's inset style, detached and clear of the home bar.
  return (
    <BottomSheet {...open}>
      {trigger ? <BottomSheet.Trigger asChild>{trigger}</BottomSheet.Trigger> : null}
      <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
        {/* Inside the portal, which moves its children away from this tree and its contexts. */}
        <DrawerSnapContext value={snap}>
          <BottomSheet.Overlay isCloseOnPress={isDismissable} />
          <BottomSheet.Content
            ref={sheet}
            detached={inset}
            bottomInset={inset ? insets.bottom + 12 : 0}
            className={inset ? "mx-4" : ""}
            backgroundClassName={inset ? "rounded-[var(--radius-container)]" : "rounded-b-none"}
            {...(snapPoints ? { snapPoints: [...snapPoints] } : {})}
            {...rest}
            {...(snapCount > 1 ? { handleComponent: DrawerHandle } : {})}
            onChange={(index, position, type) => {
              if (index >= 0) setSnapIndex(index);
              onChange?.(index, position, type);
            }}
            enablePanDownToClose={isDismissable}
            {...(label ? { accessibilityLabel: label } : {})}
          >
            {parts}
          </BottomSheet.Content>
        </DrawerSnapContext>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

/** The parts of the compound. */
interface DrawerParts {
  /** The header row: an automatic back button, the title and description, and the close button. */
  readonly Header: typeof DrawerHeader;
  /** The title, a heading-role text. */
  readonly Title: typeof DrawerTitle;
  /** A short muted line under the title. */
  readonly Description: typeof DrawerDescription;
  /** A band under the header for a segmented control, tabs or a stepper. */
  readonly SubHeader: typeof DrawerSubHeader;
  /** The body: a column for the content. */
  readonly Body: typeof ModalBody;
  /** The footer: a row for actions. */
  readonly Footer: typeof ModalFooter;
  /** The button that closes the drawer, named by its required `label`. */
  readonly Close: typeof DrawerClose;
  /** The back button: pops a view, or closes this layer of stacked drawers. */
  readonly Back: typeof DrawerBack;
  /** A drill-down of views inside the drawer, each with its own header, body and footer. */
  readonly ViewStack: typeof ViewStack;
  /** One view of `Drawer.ViewStack`. */
  readonly View: typeof ViewStack.View;
}

/**
 * A drawer: on a phone a bottom sheet, on a tablet a floating side panel, over a backdrop that blocks the screen until
 * it closes. Open it from a `trigger`, or drive it with `isOpen` and `onOpenChange`; fill it with `Drawer.Header`,
 * `Drawer.SubHeader`, `Drawer.Body` and `Drawer.Footer`, or a `Drawer.ViewStack` of views. A drawer opened inside
 * another stacks over it.
 */
export const Drawer: typeof DrawerRoot & DrawerParts = Object.assign(DrawerRoot, {
  Header: DrawerHeader,
  Title: DrawerTitle,
  Description: DrawerDescription,
  SubHeader: DrawerSubHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: DrawerClose,
  Back: DrawerBack,
  ViewStack,
  View: ViewStack.View,
});
