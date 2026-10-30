/**
 * Stackra file contract:
 * Purpose: the native `Bidi`: inline, a nested `Text` whose content sits between Unicode isolate marks, so a SKU,
 *          phone number or e-mail keeps its order inside Arabic text (React Native has no `<bdi>`); as a block, a
 *          `View` with Yoga's `direction` set and that direction given to `useDirection` below it.
 * Boundary: inline it must sit inside a `Text`, whose style it inherits; it draws no style of its own. A block with
 *           `auto` sets nothing, because Yoga has no automatic direction.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060
 *          (right-to-left); ADR 0165 (HeroUI Native on native).
 */
import { Text, View } from "react-native";
import type { ReactElement } from "react";

import { isolateText } from "#core/functions/isolate-text.function";
import { BidiDirectionContext } from "#native/bidi/bidi-direction-context";
import type { BidiProps } from "#native/bidi/bidi.props";

/** A run of text isolated from its sentence, or a block with its own direction. */
export function Bidi({
  children,
  dir = "auto",
  isBlock = false,
  style,
  ...rest
}: BidiProps): ReactElement {
  if (!isBlock) {
    // The marks wrap any children: `isolateText("")` is just the opening and the closing mark.
    const [open, close] = isolateText("", dir);
    return (
      <Text {...rest} style={style}>
        {open}
        {children}
        {close}
      </Text>
    );
  }
  if (dir === "auto")
    return (
      <View {...rest} style={style}>
        {children}
      </View>
    );
  return (
    <BidiDirectionContext value={dir}>
      <View {...rest} style={[{ direction: dir }, style]}>
        {children}
      </View>
    </BidiDirectionContext>
  );
}
