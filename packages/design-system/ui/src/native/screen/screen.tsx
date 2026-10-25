/**
 * Stackra file contract:
 * Purpose: the native `Screen`: the one container a screen's content sits in. It paints the theme background, keeps
 *          clear of the safe areas on the `edges` it is given (`react-native-safe-area-context`), scrolls its content
 *          when `isScrollable` (a `ScrollView` that lets a tap reach a button while the keyboard is open and, on iOS,
 *          moves itself above the keyboard) and, for a screen that does not scroll, lifts its content above the
 *          keyboard with a `KeyboardAvoidingView`. Right-to-left needs nothing here: no side is written.
 * Boundary: HeroUI Native has no screen container, so this is the documented form on React Native's own `View` and
 *           `ScrollView` styled with Uniwind tokens. Under a navigator, pass `edges={[]}` (or only the edge the header
 *           or tab bar does not cover): the navigator's header owns the top inset, and a scroll view under a large-title
 *           header gets its own inset from `contentInsetAdjustmentBehavior`. The scroll view takes the screen's keyboard
 *           work, so the two never add the same inset twice; Android resizes the window itself (`adjustResize`, the Expo
 *           default). A `main` role names the root for the platforms that read one; `label` is its accessibility label.
 *           Extra props pass to the root `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0317 (decisions 5 and 7); ADR 0061
 *          (React Navigation); ADR 0060; WCAG 2.2 SC 1.3.4 and 1.4.10.
 */
// Uniwind adds `className` to React Native's own components, which the root `View` and `ScrollView` take.
/// <reference types="uniwind/types" />
import type { ReactElement } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenEdge } from "#contracts/enums/screen-edge.enum";
import type { ScreenContractProps } from "#contracts/types/screen-contract-props.type";

/**
 * Props of the native Screen: the shared contract plus the root `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type ScreenProps = ScreenContractProps &
  Omit<ViewProps, keyof ScreenContractProps | "accessibilityLabel">;

/**
 * The screen's content in the box the edges leave. A scrolling screen is a `ScrollView`; a fixed one is a `View`
 * inside a `KeyboardAvoidingView` that pads on iOS, where Android's window resize already does the work.
 */
export function Screen({
  isScrollable = true,
  isKeyboardAvoiding = true,
  edges = ScreenEdge,
  label,
  className,
  style,
  children,
  ...rest
}: ScreenProps): ReactElement {
  const insets = useSafeAreaInsets();
  // Called on every render so the hook order is stable; an edge left out is no padding at all.
  const inset = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("sides") ? insets.left : 0,
    paddingRight: edges.includes("sides") ? insets.right : 0,
  };
  return (
    <View
      {...rest}
      role="main"
      {...(label ? { accessibilityLabel: label } : {})}
      className={["flex-1 bg-background", className].filter(Boolean).join(" ")}
      style={[inset, style]}
    >
      {isScrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow"
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={isKeyboardAvoiding}
        >
          {children}
        </ScrollView>
      ) : isKeyboardAvoiding ? (
        <KeyboardAvoidingView
          className="flex-1"
          {...(Platform.OS === "ios" ? { behavior: "padding" as const } : {})}
        >
          {children}
        </KeyboardAvoidingView>
      ) : (
        <View className="flex-1">{children}</View>
      )}
    </View>
  );
}
