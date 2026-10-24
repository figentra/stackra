/**
 * Stackra file contract:
 * Purpose: the native `Breadcrumbs`: the same trail as the web component, from the root to the current page, as a
 *          wrapping row of text. Every step with an `href` or an `onPress` is a native `Link`, so it navigates through
 *          the nearest `RouterProvider` or runs its handler; the last step is the current page, plain text.
 * Boundary: HeroUI Native has no breadcrumbs, so this is the adapted form on the `@stackra/ui` Link and Text over a
 *          plain `View` (ADR 0302 decision 3). A stack header's back button is the usual way back on a phone, so an
 *          app may draw this only where a trail helps, for example on a tablet. The separator is a chevron that
 *          mirrors in right-to-left text and is hidden from screen readers. Every other prop passes to the `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decision 7); ADR 0060
 *          (right-to-left).
 */
import { Fragment } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";

import type { BreadcrumbsContractProps } from "#contracts/types/breadcrumbs-contract-props.type";
import { Icon } from "#native/icon/icon";
import { Link } from "#native/link/link";
import { Text } from "#native/text/text";

// shortcut: English until @stackra/i18n ships; then the key `ui::breadcrumbs.label`.
const STRINGS = { label: "Breadcrumbs" } as const;

/**
 * Props of the native Breadcrumbs: the shared contract plus the `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type BreadcrumbsProps = BreadcrumbsContractProps &
  Omit<ViewProps, keyof BreadcrumbsContractProps | "accessibilityLabel" | "children">;

/**
 * The trail from the root to the current page. Every step but the last that has somewhere to go is a link; the last is
 * the current page, drawn as text.
 */
export function Breadcrumbs({
  items,
  label = STRINGS.label,
  className,
  ...rest
}: BreadcrumbsProps) {
  return (
    <View
      {...rest}
      accessibilityLabel={label}
      className={["flex-row flex-wrap items-center gap-1", className].filter(Boolean).join(" ")}
    >
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1;
        const isLink = !isCurrent && (item.href !== undefined || item.onPress !== undefined);
        return (
          <Fragment key={item.id}>
            {isLink ? (
              <Link href={item.href} onPress={item.onPress} underline="always">
                {item.label}
              </Link>
            ) : (
              <Text type="small" tone={isCurrent ? "default" : "muted"}>
                {item.label}
              </Text>
            )}
            {isCurrent ? null : (
              <Icon name="chevron-right" size="sm" tone="muted" isMirroredInRtl />
            )}
          </Fragment>
        );
      })}
    </View>
  );
}
