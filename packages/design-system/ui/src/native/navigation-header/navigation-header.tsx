/**
 * Stackra file contract:
 * Purpose: the native `NavigationHeader`, a presentational header the navigator renders (React Navigation's `header`
 *          option, bound by @stackra/navigation). A row from the inline start: the back button when `onBack` or
 *          `backHref` is given (a ghost IconButton whose chevron mirrors in right-to-left), `startContent`, the `title`
 *          as a heading taking the room left over, and `endContent`. With `hasLargeTitle` the title is drawn large
 *          under the row. The header keeps clear of the status bar with the top safe-area inset, and `label` is its
 *          accessibility label.
 * Boundary: HeroUI Native has no navigation header, so this is a plain `View` row on theme tokens, composed from the
 *           wave 1 IconButton and the Heading. It imports no other shell piece (ADR 0314 decision 4) and no router:
 *           `backHref` is an app path opened through the nearest `RouterProvider`, after `onBack` has run, and does
 *           nothing without one. A string or number in a slot is drawn inside `Text` (React Native refuses a bare
 *           string in a `View`); a title that is any other node is drawn as given. `headingLevel` is accepted and
 *           ignored, because React Native has no heading levels. A custom React Navigation header must handle the status
 *           bar itself, so the inset is on by default; `hasTopInset={false}` is for a header drawn under one that has
 *           already cleared it. Extra props pass to the root `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0314 (decisions 1, 4 and 7); ADR
 *          0061 (React Navigation); ADR 0060; WCAG 2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
// Uniwind adds `className` to React Native's own components, which the root `View` takes.
/// <reference types="uniwind/types" />
import { use, type ReactElement, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { NavigationHeaderContractProps } from "#contracts/types/navigation-header-contract-props.type";
import { Heading } from "#native/heading/heading";
import { Icon } from "#native/icon/icon";
import { IconButton } from "#native/icon-button/icon-button";
import { RouterContext } from "#native/router-provider/router-context";
import { Text } from "#native/text/text";

// shortcut: English until @stackra/i18n ships; then the key `ui::navigation-header.back`.
const STRINGS = { back: "Back" } as const;

/** An absolute URL starts with a scheme; the back button opens app paths only, so it never follows one. */
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

/**
 * Props of the native NavigationHeader: the shared contract, the top inset switch and the root `View`'s own props,
 * passed through. The view's `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type NavigationHeaderProps = NavigationHeaderContractProps & {
  /** True to pad the top by the status bar's safe-area inset. Defaults to true. */
  readonly hasTopInset?: boolean | undefined;
} & Omit<
    ViewProps,
    keyof NavigationHeaderContractProps | "hasTopInset" | "accessibilityLabel" | "children"
  >;

/** The back chevron, mirrored in right-to-left because it points the reading way back. */
const BACK_ICON = <Icon name="chevron-left" isMirroredInRtl />;

/** A node as the bar can draw it: a string or number goes inside `Text`, any other node as it is. */
function textual(node: ReactNode): ReactNode {
  return typeof node === "string" || typeof node === "number" ? (
    <Text numberOfLines={1}>{node}</Text>
  ) : (
    node
  );
}

/**
 * The compact header of one screen: back button, start slot, title and end slot, in that order from the inline start.
 * The title takes the room left over, so the end slot stays at the inline end.
 */
export function NavigationHeader({
  title,
  headingLevel = 1,
  hasLargeTitle = false,
  onBack,
  backHref,
  backLabel = STRINGS.back,
  startContent,
  endContent,
  label,
  hasTopInset = true,
  className,
  style,
  ...rest
}: NavigationHeaderProps): ReactElement {
  const insets = useSafeAreaInsets();
  const navigate = use(RouterContext);
  const goBack = () => {
    onBack?.();
    if (backHref !== undefined && navigate && !HAS_SCHEME.test(backHref)) navigate(backHref);
  };
  const heading =
    typeof title === "string" || typeof title === "number" ? (
      <Heading
        level={headingLevel}
        type={hasLargeTitle ? "h2" : "h5"}
        isTruncated={!hasLargeTitle}
        className={hasLargeTitle ? "px-4 pb-3" : "min-w-0 shrink"}
      >
        {title}
      </Heading>
    ) : (
      title
    );
  return (
    <View
      {...rest}
      {...(label ? { accessibilityLabel: label } : {})}
      className={["border-b border-separator bg-background", className].filter(Boolean).join(" ")}
      style={[hasTopInset ? { paddingTop: insets.top } : null, style]}
    >
      <View className="min-h-14 flex-row items-center gap-2 px-2 py-2">
        {onBack === undefined && backHref === undefined ? null : (
          <IconButton icon={BACK_ICON} label={backLabel} variant="ghost" onPress={goBack} />
        )}
        {textual(startContent)}
        <View className="min-w-0 flex-1 flex-row items-center">
          {hasLargeTitle ? null : heading}
        </View>
        {endContent == null ? null : (
          <View className="flex-row items-center gap-1">{textual(endContent)}</View>
        )}
      </View>
      {hasLargeTitle ? heading : null}
    </View>
  );
}
