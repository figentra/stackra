/**
 * Stackra file contract:
 * Purpose: `ModalSection`, the shared body of the native `Header`, `Body` and `Footer` of a modal or a drawer:
 *          HeroUI Native's Dialog has no such parts, so each is the adapted form on a free `View`, spaced like the web
 *          ones (the header and body in a column, the footer a row of actions at the reading end), and a string child
 *          is wrapped in `Text`, because React Native refuses a bare string inside a `View`.
 * Boundary: built on the free `View` and the design system's `Text` only; the only styling is the gaps. Shared by the
 *           native `Modal` and `Drawer`, which expose them as `Modal.Header` and `Drawer.Header` and so on. Long
 *           content scrolls only if the caller puts a `ScrollView` in the body. Internal: not in the `./native` barrel;
 *           `modal-header`, `modal-body` and `modal-footer` give each part its gaps.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0165 (HeroUI Native on native); ADR 0312.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { Text } from "#native/text/text";
import type { ModalSectionProps } from "#native/modal/modal-section.props";

/** A `View` with the section's base gaps, merged with the caller's class, whose string child is drawn as `Text`. */
export function ModalSection({
  base,
  className,
  children,
  ...rest
}: ModalSectionProps & { readonly base: string }): ReactElement {
  return (
    <View className={[base, className].filter(Boolean).join(" ")} {...rest}>
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </View>
  );
}
