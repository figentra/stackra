/**
 * Stackra file contract:
 * Purpose: `MaterialBackdrop`, the content glass chrome blurs on Android: expo-blur's `BlurTargetView` around a
 *          screen's content, handed to every `GlassSurface` below through `BlurTargetContext`. Android 12+ blurs only a
 *          view it is pointed at; iOS blurs whatever lies behind, so there it is a plain View.
 * Boundary: wraps content only; the chrome (header, tab bar, action bar) sits beside it, never inside it, or it would
 *           blur itself. Without one, Android draws chrome solid.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decision 7 as amended 2026-10-31).
 */
import { BlurTargetView } from "expo-blur";
import { useRef, type ReactElement, type ReactNode } from "react";
import { Platform, View, type ViewProps } from "react-native";

import { BlurTargetContext } from "#native/glass/blur-target-context";

/** The content behind glass chrome, the blur's source on Android. */
export function MaterialBackdrop({
  children,
  ...rest
}: ViewProps & { readonly children?: ReactNode }): ReactElement {
  const target = useRef<View | null>(null);
  if (Platform.OS !== "android") return <View {...rest}>{children}</View>;
  return (
    <BlurTargetContext value={target}>
      <BlurTargetView ref={target} {...rest}>
        {children}
      </BlurTargetView>
    </BlurTargetContext>
  );
}
