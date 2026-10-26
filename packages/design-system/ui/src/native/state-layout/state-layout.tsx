/**
 * Stackra file contract:
 * Purpose: the native layout EmptyState and ErrorState share: a column centred on the screen with the icon in a round
 *          well, the title as a heading, the description, any extra content (an error's details) and a wrapping row
 *          of actions, in that order.
 * Boundary: internal, not in the `native` barrel; the two states import it by path. HeroUI Native's Pro set has an
 *           empty state, the free one does not, so this is the documented adapted form on free parts: `Heading`, `Text`
 *           and `Icon` in views. The default icon is drawn through a nested `IconRegistryProvider` holding only the
 *           state icons. A string child is always wrapped in `Text` (a bare string in a `View` is an error); the
 *           actions and the extra content are elements. Needs the native DesignSystemProvider, as `Text` does.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decisions 7 and 10); ADR 0313
 *          (decisions 5 and 6); WCAG 2.2 SC 1.3.1 and 1.4.1.
 */
import { IconRegistryProvider } from "@stackra/icons/native";
import { View } from "react-native";

import { Heading } from "#native/heading/heading";
import { Icon } from "#native/icon/icon";
import { STATE_ICONS } from "#native/state-layout/state-icons.constant";
import { Text } from "#native/text/text";
import type { StateLayoutProps } from "#native/state-layout/state-layout.props";

/** The icon, title, description, extra content and actions of a state, centred in a column. */
export function StateLayout({
  title,
  description,
  icon,
  actions,
  headingLevel,
  defaultIcon,
  className,
  children,
  ...rest
}: StateLayoutProps) {
  return (
    <View
      {...rest}
      className={["items-center gap-3 px-6 py-12", className].filter(Boolean).join(" ")}
    >
      {icon === false ? null : (
        <View className="size-12 items-center justify-center rounded-full bg-default">
          {icon !== undefined && typeof icon !== "string" ? (
            icon
          ) : (
            <IconRegistryProvider registry={STATE_ICONS}>
              <Icon name={icon ?? defaultIcon} size="lg" tone="muted" />
            </IconRegistryProvider>
          )}
        </View>
      )}
      <Heading level={headingLevel} type="h3" align="center">
        {title}
      </Heading>
      {description == null ? null : (
        <Text tone="muted" align="center">
          {description}
        </Text>
      )}
      {children}
      {actions == null ? null : (
        <View className="mt-2 flex-row flex-wrap items-center justify-center gap-2">{actions}</View>
      )}
    </View>
  );
}
