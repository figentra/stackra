/**
 * Stackra file contract:
 * Purpose: the web layout EmptyState and ErrorState share: a column centred on the page with the icon in a round
 *          well, the title as a heading, the description, any extra content (an error's details) and a wrapping row
 *          of actions, in that order.
 * Boundary: internal, not in the `react` barrel; the two states import it by path. HeroUI v3 has no empty-state
 *           component (it is HeroUI Pro's), so this is the documented adapted form on free parts: `Heading`, `Text`
 *           and `Icon`. The default icon is drawn through a nested `IconRegistryProvider` holding only the state
 *           icons, so it shows with nothing registered by the app. Only layout utilities and theme roles are written,
 *           no physical sides, so right-to-left mirrors by itself.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decisions 7 and 10); ADR 0313
 *          (decisions 5 and 6); WCAG 2.2 SC 1.3.1 and 1.4.1.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";

import { Heading } from "#react/heading/heading";
import { Icon } from "#react/icon/icon";
import { STATE_ICONS } from "#react/state-layout/state-icons.constant";
import { Text } from "#react/text/text";
import type { StateLayoutProps } from "#react/state-layout/state-layout.props";

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
}: StateLayoutProps): ReactElement {
  return (
    <div
      {...rest}
      className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className) ?? ""}
    >
      {icon === false ? null : (
        <div
          data-slot="state-icon"
          className="flex size-12 items-center justify-center rounded-[var(--radius-pill)] bg-default"
        >
          {icon !== undefined && typeof icon !== "string" ? (
            icon
          ) : (
            <IconRegistryProvider registry={STATE_ICONS}>
              <Icon name={icon ?? defaultIcon} size="lg" tone="muted" />
            </IconRegistryProvider>
          )}
        </div>
      )}
      <Heading level={headingLevel} type="h3" align="center">
        {title}
      </Heading>
      {description == null ? null : (
        <Text tone="muted" align="center" className="max-w-prose">
          {description}
        </Text>
      )}
      {children}
      {actions == null ? null : (
        <div
          data-slot="state-actions"
          className="mt-2 flex flex-wrap items-center justify-center gap-2"
        >
          {actions}
        </div>
      )}
    </div>
  );
}
