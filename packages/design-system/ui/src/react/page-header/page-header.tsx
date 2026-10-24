/**
 * Stackra file contract:
 * Purpose: the web `PageHeader`: the top of a page, a `header` holding the breadcrumb trail, the title as a real
 *          heading (the page's `h1` by default, `headingLevel` to move it), the `status` beside it, a muted line under
 *          it and the page's actions. `actions` is an ordered list: the first is the primary button, the next two are
 *          secondary buttons and the rest go in an ActionMenu named by `moreActionsLabel`. `startContent` leads the
 *          title and `endContent` follows the actions. An action with an `href` is a link drawn as a button, so it
 *          navigates through the nearest `RouterProvider`; one with only `onPress` is a button.
 * Boundary: HeroUI has no page header, so this is the documented adapted form on the earlier waves' `Breadcrumbs`,
 *           `Heading`, `Text`, `Button` and `ActionMenu` over a flex layout of theme tokens, and it imports no sibling
 *           piece of wave 6: `status` is a node (ADR 0314 decision 4). The link-as-button is React Aria's `Link` with
 *           HeroUI's `buttonVariants`, the composition HeroUI documents for a router link. The title is drawn in the
 *           `h3` style whatever its level, because the largest style is a marketing size too big for a console page.
 *           `label` makes the header a named group, never a landmark: a `header` inside `main` is not a banner, and a
 *           plain element may not take `aria-label`. A disabled action is always a button, so it leaves the tab order
 *           like every disabled button. The trail's landmark name is Breadcrumbs' own, so a page that draws two headers
 *           with a trail each gives one of them its own `Breadcrumbs` instead.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3, decision 5: adapted form); ADR 0303 (decision 7); ADR 0314 (decisions 1, 4
 *          and 5); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 2.4.6, 2.4.8 and 2.5.8.
 */
import { buttonVariants, cn } from "@heroui/react";
import type { ComponentPropsWithRef, ReactElement } from "react";
import { Link as RouterLink } from "react-aria-components";

import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { PageHeaderContractProps } from "#contracts/types/page-header-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { pageActionVariant } from "#core/functions/page-action-variant.function";
import { splitPageActions } from "#core/functions/split-page-actions.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import { Breadcrumbs } from "#react/breadcrumbs/breadcrumbs";
import { Button } from "#react/button/button";
import { Heading } from "#react/heading/heading";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import { Text } from "#react/text/text";

// shortcut: English until @stackra/i18n ships; then the key `ui::page-header.more-actions`.
const STRINGS = { moreActions: "More actions" } as const;

/**
 * Props of the web PageHeader: the shared contract plus the `header` element's own props, passed through. The
 * element's `aria-label` is the contract's `label` and its `title` attribute gives way to the contract's `title`, so
 * the type refuses the first and replaces the second.
 */
export type PageHeaderProps = PageHeaderContractProps &
  Omit<ComponentPropsWithRef<"header">, keyof PageHeaderContractProps | "aria-label" | "children">;

/** One shown action: a link drawn as a button when it has somewhere to go, a button otherwise. */
function ActionButton({
  action,
  isPrimary,
}: {
  readonly action: MenuLeafItem;
  readonly isPrimary: boolean;
}): ReactElement {
  const variant = pageActionVariant(action, isPrimary);
  if (action.href && !action.isDisabled) {
    return (
      <RouterLink
        href={action.href}
        {...(action.onPress ? { onPress: action.onPress } : {})}
        className={buttonVariants({ variant })}
      >
        <SlotIcon icon={action.icon} />
        {action.label}
      </RouterLink>
    );
  }
  return (
    <Button
      variant={variant}
      {...omitUndefined({
        isDisabled: action.isDisabled,
        onPress: action.onPress,
        startIcon: action.icon,
      })}
    >
      {action.label}
    </Button>
  );
}

/**
 * The top of a page: trail, title with status, description and actions. The title is the page's `h1` unless
 * `headingLevel` says otherwise; draw one per page.
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
    <header
      {...rest}
      {...(label ? { role: "group", "aria-label": label } : {})}
      className={cn("flex flex-col gap-3", className)}
    >
      {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
          {startContent}
          <div className="grid min-w-0 gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Heading level={headingLevel} type="h3">
                {title}
              </Heading>
              {status}
            </div>
            {description == null ? null : <Text tone="muted">{description}</Text>}
          </div>
        </div>
        {hasActions ? (
          <div data-slot="page-header-actions" className="flex flex-wrap items-center gap-2">
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
            {endContent}
          </div>
        ) : null}
      </div>
    </header>
  );
}
