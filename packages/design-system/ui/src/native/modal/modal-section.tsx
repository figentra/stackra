/**
 * Stackra file contract:
 * Purpose: the native `Header`, `Body` and `Footer` of a modal or a drawer: HeroUI Native's Dialog has no such parts,
 *          so each is the adapted form on a free `View`, spaced like the web ones (the header and body in a column,
 *          the footer a row of actions at the reading end), and a string child is wrapped in `Text`, because React
 *          Native refuses a bare string inside a `View`.
 * Boundary: built on the free `View` and the design system's `Text` only; the only styling is the gaps. Shared by the
 *           native `Modal` and `Drawer`, which expose them as `Modal.Header` and `Drawer.Header` and so on. Long
 *           content scrolls only if the caller puts a `ScrollView` in the body.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0165 (HeroUI Native on native); ADR 0312.
 */
import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";

import { Text } from "#native/text/text";

/** Props of the native Modal and Drawer sections: the props of a `View`, passed through unchanged. */
export type ModalSectionProps = ViewProps;

/** A `View` with the section's base gaps, merged with the caller's class, whose string child is drawn as `Text`. */
function Section({
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

/** The header: a column for the title and a short description under it. */
export function ModalHeader(props: ModalSectionProps): ReactElement {
  return <Section base="gap-1 pb-3" {...props} />;
}

/** The body: a column for the content. */
export function ModalBody(props: ModalSectionProps): ReactElement {
  return <Section base="gap-3 py-2" {...props} />;
}

/** The footer: a row for actions, at the reading end of the line in both directions. */
export function ModalFooter(props: ModalSectionProps): ReactElement {
  return <Section base="flex-row items-center justify-end gap-2 pt-4" {...props} />;
}
