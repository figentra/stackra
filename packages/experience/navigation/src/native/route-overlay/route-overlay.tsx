/**
 * Stackra file contract:
 * Purpose: the native `RouteOverlay`: the content of a stack screen that is presented as an overlay. The screen's
 *          options come from `routeOverlayScreenOptions(presentation)`. For `modal` and `full-screen` the screen is the
 *          platform's own modal, so this draws a title, a close button, the body and a footer in it; for `sheet` and
 *          `drawer` the screen is a transparent modal and this opens `@stackra/ui`'s `Drawer` (HeroUI Native's inset
 *          bottom sheet) over it, open for as long as the screen is. Closing (the close button, a swipe, a press on
 *          the scrim, `useRouteOverlay().close()`) pops the screen.
 * Boundary: glue over React Navigation and `@stackra/ui`; no styling beyond the layout of the modal's header. The
 *           iOS swipe-down of a `modal` or `full-screen` overlay follows `isDismissable` (`gestureEnabled`); the
 *           Android back button is not blocked, because the system owns it: unsaved work is guarded by
 *           `RouteLeaveConfirmation`, which the stack consults for back and swipe alike. There is no close animation
 *           of our own: the stack's pop is the animation. The sheet needs the app's `HeroUINativeProvider`,
 *           GestureHandlerRootView and the `@gorhom/bottom-sheet` peer, as `Drawer` does; verify the sheet over a
 *           native modal on a device. Strings the caller passes as `title`, `children` or `footer` are wrapped in
 *           `Text` by the kit's sections.
 * Runtime: react-native
 * Governing contract: ADR 0314 (decisions 2, 8 and 9); ADR 0312; ADR 0165 (HeroUI Native on native); WCAG 2.2
 *          SC 2.1.2, 2.4.3 and 4.1.2.
 */
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useLinkTo, useNavigation, type ParamListBase } from "@react-navigation/native";
import * as Ui from "@stackra/ui/native";
import { useCallback, useLayoutEffect, useMemo, useState, type ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RouteOverlayContractProps } from "#contracts/types/route-overlay-contract-props.type";
import type { RouteOverlayControls } from "#contracts/types/route-overlay-controls.type";
import { RouteOverlayContext } from "#native/route-overlay/route-overlay-context";

/** Props of the native RouteOverlay: the shared contract, in which `size` is unread (the platform sizes modals). */
export type RouteOverlayProps = RouteOverlayContractProps;

/**
 * The page of a stack screen presented as a modal, sheet, drawer or full-screen page. Register the screen with
 * `routeOverlayScreenOptions(presentation)`; the open state is the screen, so the overlay needs no `isOpen`.
 */
export function RouteOverlay({
  children,
  title,
  closeLabel,
  presentation = "modal",
  isDismissable: startsDismissable = true,
  footer,
}: RouteOverlayProps): ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const linkTo = useLinkTo();
  const insets = useSafeAreaInsets();
  // `isDismissable` is the starting value: a screen changes it later through `useRouteOverlay().setDismissable`.
  const [isDismissable, setDismissable] = useState(startsDismissable);
  const isPanel = presentation === "sheet" || presentation === "drawer";

  const close = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);
  const complete = useCallback(
    (to?: string) => {
      close();
      if (to) linkTo(to);
    },
    [close, linkTo],
  );
  const controls = useMemo<RouteOverlayControls>(
    () => ({ close, complete, setDismissable, isDismissable }),
    [close, complete, isDismissable],
  );

  // The sheet owns its own gestures; only the platform modals take the stack's swipe-down.
  useLayoutEffect(() => {
    if (!isPanel) navigation.setOptions({ gestureEnabled: isDismissable });
  }, [navigation, isPanel, isDismissable]);

  return (
    <RouteOverlayContext value={controls}>
      {isPanel ? (
        <Ui.Drawer
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) close();
          }}
          isDismissable={isDismissable}
        >
          <Ui.Drawer.Close label={closeLabel} />
          <Ui.Drawer.Header>
            <Ui.Drawer.Title>{title}</Ui.Drawer.Title>
          </Ui.Drawer.Header>
          <Ui.Drawer.Body>{children}</Ui.Drawer.Body>
          {footer ? <Ui.Drawer.Footer>{footer}</Ui.Drawer.Footer> : null}
        </Ui.Drawer>
      ) : (
        <View
          className="flex-1 bg-background px-4 pt-4"
          // A full-screen modal reaches under the status bar; the platform's modal card starts below it.
          style={{
            paddingTop: presentation === "full-screen" ? insets.top + 16 : 16,
            paddingBottom: insets.bottom + 12,
          }}
        >
          {/* The sections are the kit's drawer parts: plain views that wrap a string child in Text. */}
          <Ui.Drawer.Header className="flex-row items-center justify-between gap-2">
            <Ui.Heading level={2} className="flex-1">
              {title}
            </Ui.Heading>
            <Ui.CloseButton label={closeLabel} onPress={close} />
          </Ui.Drawer.Header>
          <Ui.Drawer.Body className="flex-1">{children}</Ui.Drawer.Body>
          {footer ? <Ui.Drawer.Footer>{footer}</Ui.Drawer.Footer> : null}
        </View>
      )}
    </RouteOverlayContext>
  );
}
