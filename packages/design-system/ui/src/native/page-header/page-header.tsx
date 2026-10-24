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
 *           `Heading`, `Text`, `Button` and `ActionMenu`, and it imports no sibling piece of wave 6 (ADR 0314 decision
 *           4). The title is drawn in the `h3` style whatever its level, and React Native reports no heading levels, so
 *           `headingLevel` only reaches the shared `Heading`. A string or number in `startContent`, `status` or
 *           `endContent` is drawn inside `Text`, since React Native refuses a bare string in a `View`. `label` is an
 *           accessibility label on the root `View`. A disabled action is a disabled button, which its reason does not
 *           reach: the reason is the overflow menu's second line only. Extra props pass to the root `View`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0314 (decisions 1, 4 and 7); WCAG
 *          2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import { use, type ReactElement, type ReactNode } from "react";
import { Linking, View, type ViewProps } from "react-native";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { PageHeaderContractProps } from "#contracts/types/page-header-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pageActionVariant } from "#core/functions/page-action-variant.function";
import { splitPageActions } from "#core/functions/split-page-actions.function";
import { ActionMenu } from "#native/action-menu/action-menu";
import { Breadcrumbs } from "#native/breadcrumbs/breadcrumbs";
import { Button } from "#native/button/button";
import { Heading } from "#native/heading/heading";
import { RouterContext } from "#native/router-provider/router-context";
import { Text } from "#native/text/text";

/** An absolute URL: it starts with a scheme (`https:`, `mailto:`, `tel:`, the app's own). */
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

// shortcut: English until @stackra/i18n ships; then the keys `ui::page-header.more-actions` and
// `ui::page-header.could-not-open`.
const STRINGS = {
  moreActions: "More actions",
  couldNotOpen: "Link could not open its URL",
} as const;

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

/** One shown action: a button that runs `onPress` and then follows `href`. */
function ActionButton({
  action,
  isPrimary,
}: {
  readonly action: MenuLeafItem;
  readonly isPrimary: boolean;
}): ReactElement {
  const navigate = use(RouterContext);
  const follow = () => {
    action.onPress?.();
    const { href } = action;
    if (!href) return;
    if (navigate && !HAS_SCHEME.test(href)) {
      navigate(href);
      return;
    }
    // The URL stays out of the warning: it may hold a token.
    Linking.openURL(href).catch(() => console.warn(STRINGS.couldNotOpen));
  };
  return (
    <Button
      variant={pageActionVariant(action, isPrimary)}
      onPress={follow}
      {...omitUndefined({ isDisabled: action.isDisabled, startIcon: action.icon })}
    >
      {action.label}
    </Button>
  );
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
  moreActionsLabel = STRINGS.moreActions,
  label,
  className,
  ...rest
}: PageHeaderProps): ReactElement {
  const { visible, overflow } = splitPageActions(actions ?? []);
  const hasActions = visible.length > 0 || endContent != null;

  return (
    <View
      {...rest}
      {...(label ? { accessibilityLabel: label } : {})}
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
      {hasActions ? (
        <View className="flex-row flex-wrap items-center gap-2">
          {visible.map((action, index) => (
            <ActionButton key={action.id} action={action} isPrimary={index === 0} />
          ))}
          {overflow.length === 0 ? null : (
            <ActionMenu
              label={moreActionsLabel}
              variant="secondary"
              sections={[
                {
                  id: "more-actions",
                  title: moreActionsLabel,
                  isTitleHidden: true,
                  items: overflow,
                },
              ]}
            />
          )}
          {textual(endContent)}
        </View>
      ) : null}
    </View>
  );
}
