/**
 * Stackra file contract:
 * Purpose: the native `Breadcrumbs`: the same trail as the web component, from the root to the current page, as a
 *          wrapping row of text. Every step with an `href` or an `onPress` is a native `Link`, so it navigates through
 *          the nearest `RouterProvider` or runs its handler; the last step is the current page, plain text.
 * Boundary: HeroUI Native has no breadcrumbs, so this is the adapted form on the `@stackra/ui` Link and Text over a
 *          plain `View` (ADR 0302 decision 3). A stack header's back button is the usual way back on a phone, so an
 *          app may draw this only where a trail helps, for example on a tablet. The separator is a chevron that
 *          mirrors in right-to-left text and is hidden from screen readers. The current step is marked selected and spoken
 *          with the trail's name, the native form of the web `aria-current`. Every other prop passes to the `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decision 7); ADR 0060
 *          (right-to-left).
 */
import { Fragment } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#native/icon/icon";
import { Link } from "#native/link/link";
import { Text } from "#native/text/text";
import type { BreadcrumbsProps } from "#native/breadcrumbs/breadcrumbs.props";

/**
 * The trail from the root to the current page. Every step but the last that has somewhere to go is a link; the last is
 * the current page, drawn as text.
 */
export function Breadcrumbs({ items, label: labelProp, className, ...rest }: BreadcrumbsProps) {
  const t = useUiText();
  const label = labelProp ?? t(UI_KEYS.ui.breadcrumbs.label);
  return (
    <View
      {...rest}
      role="navigation"
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
              <Text
                type="small"
                tone={isCurrent ? "default" : "muted"}
                // iOS ignores a label on a container that is not itself accessible, and making the container accessible
                // would swallow the links, so the current step carries the trail's name and says it is selected.
                {...(isCurrent
                  ? {
                      accessibilityState: { selected: true },
                      accessibilityLabel: `${label}: ${item.label}`,
                    }
                  : {})}
              >
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
