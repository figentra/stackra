/**
 * Stackra file contract:
 * Purpose: the native `PageHeader`, an adapted form: the in-content header of a screen, a column holding the
 *          breadcrumb trail, the title as a heading with the `status` beside it, a muted line under it and the page's
 *          actions. `actions` is an ordered list: the first is the primary button, the next two are secondary buttons
 *          and the rest go in an ActionMenu named by `moreActionsLabel`. `startContent` leads the title and
 *          `endContent` follows the actions. An action with an `href` follows it after its `onPress`: an app path
 *          through the nearest `RouterProvider`, an absolute URL in the system browser.
 * Boundary: HeroUI Native has no page header and the navigator's header bar carries only a title and trailing
 *           buttons (`NavigationHeader`), so this is a plain `View` layout on the earlier waves' `Breadcrumbs`,
 *           `Heading` and `Text`, and it imports no sibling piece of wave 6 (ADR 0317 decision 4). The actions row is
 *           `PageActions`, an internal row shared with Section and not a shell piece. The title is drawn in the `h3`
 *           style whatever its level, and React Native reports no heading levels, so `headingLevel` only reaches the
 *           shared `Heading`. A string or number in `startContent` or `status` is drawn inside `Text`, since React
 *           Native refuses a bare string in a `View`. `label` names the root `View`, which takes the `group` role
 *           only when it has a name, as on web. Extra props pass to the root `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4 and 7); WCAG
 *          2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import type { PageHeaderContractProps } from "#contracts/types/page-header-contract-props.type";
import { Breadcrumbs } from "#native/breadcrumbs/breadcrumbs";
import { Heading } from "#native/heading/heading";
import { PageActions } from "#native/page-actions/page-actions";
import { Text } from "#native/text/text";

/**
 * Props of the native PageHeader: the shared contract plus the root `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type PageHeaderProps = PageHeaderContractProps &
  Omit<ViewProps, keyof PageHeaderContractProps | "accessibilityLabel" | "children">;

/** A node as the header can draw it: a string or number goes inside `Text`, any other node as it is. */
function textual(node: ReactNode): ReactNode {
  return typeof node === "string" || typeof node === "number" ? <Text>{node}</Text> : node;
}

/**
 * The top of a screen's content: trail, title with status, description and actions. Draw one per screen.
 */
export function PageHeader({
  title,
  description,
  headingLevel = 1,
  breadcrumbs,
  status,
  actions,
  startContent,
  endContent,
  moreActionsLabel,
  label,
  className,
  ...rest
}: PageHeaderProps): ReactElement {
  const t = useUiText();
  moreActionsLabel ??= t(UI_KEYS.ui.page_header.more_actions);
  return (
    <View
      {...rest}
      {...(label ? { role: "group", accessibilityLabel: label } : {})}
      className={["gap-3", className].filter(Boolean).join(" ")}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs items={breadcrumbs} /> : null}
      <View className="flex-row items-start gap-3">
        {textual(startContent)}
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <Heading level={headingLevel} type="h3">
              {title}
            </Heading>
            {textual(status)}
          </View>
          {description == null ? null : <Text tone="muted">{description}</Text>}
        </View>
      </View>
      <PageActions
        actions={actions ?? []}
        moreActionsLabel={moreActionsLabel}
        endContent={endContent}
      />
    </View>
  );
}
